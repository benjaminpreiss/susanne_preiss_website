import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm, access, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
import sharp from 'sharp';
import { english as englishStrings } from './fixtures/ui';
import { buildFixture, seedImageCache } from './fixture-build';

// Build actual Astro HTML in a disposable sibling root. Never modify production content.
test(
  'isolated multilingual Markdoc builds: editing, ordering, references and invalid content',
  { timeout: 360_000 },
  async (t) => {
    const fixture = await mkdtemp(resolve('.fixture-'));
    const build = () => buildFixture(fixture);
    const html = async (path: string) => load(await readFile(join(fixture, 'dist', path), 'utf8'));
    const validate = () =>
      spawnSync(
        process.execPath,
        [resolve('node_modules/tsx/dist/cli.mjs'), resolve('scripts/validate-build.ts')],
        { cwd: fixture, encoding: 'utf8' },
      );
    try {
      for (const name of [
        'src',
        'content',
        'public',
        'astro.config.mjs',
        'markdoc.config.ts',
        'tsconfig.json',
        'package.json',
        'svelte.config.js',
      ])
        await cp(resolve(name), join(fixture, name), { recursive: true });
      await seedImageCache(fixture);
      // Workshops now has production editorial sections; keep its real German entry.
      await cp(resolve('tests/fixtures/pages/en'), join(fixture, 'content/pages/en'), {
        recursive: true,
      });
      // Exercise real Astro/Vite ESM bundling without adding libraries to production About.
      await writeFile(
        join(fixture, 'src/pages/compatibility.astro'),
        `<html><head><title>Isolated compatibility fixture</title></head><body><script>
import { gsap } from 'gsap';
import '@videojs/html/video/player';
import '@videojs/html/video/compat-skin';
import '@videojs/html/media/hlsjs-video';
console.info(gsap.version, customElements.get('video-player'));
</script></body></html>`,
      );
      const dictionaryPath = join(fixture, 'content/ui.json');
      const dictionaries = JSON.parse(await readFile(dictionaryPath, 'utf8'));
      await writeFile(
        dictionaryPath,
        JSON.stringify({ ...dictionaries, en: englishStrings }, null, 2) + '\n',
      );
      const utilitySlugs = {
        contact: 'contact',
        imprint: 'en/legal-notice',
        privacy: 'legal/privacy-policy',
      };
      const germanUtilities: Record<string, string> = {
        contact: '/kontakt/',
        imprint: '/impressum/',
        privacy: '/datenschutz/',
      };
      for (const [key, slug] of Object.entries(utilitySlugs)) {
        await writeFile(
          join(fixture, `content/shared/${key}-en.mdoc`),
          `---\ntranslationKey: ${key}\nlocale: en\npublication: published\ntitle: Fixture ${key}\nslug: /${slug}\ndescription: English ${key} description\n---\n\n${key === 'contact' ? '' : `# Fixture ${key}\n\n`}Isolated English ${key} fixture.\n`,
        );
      }
      let result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const validation = validate();
      assert.equal(validation.status, 0, validation.stdout + validation.stderr);
      const german = await html('ueber-mich/index.html');
      const english = await html('about-susanne/index.html');
      assert.equal(german('html').attr('lang'), 'de');
      assert.equal(english('html').attr('lang'), 'en');
      assert.equal(english('title').text(), 'English fixture title');
      assert.equal(english('meta[property="og:title"]').attr('content'), 'English fixture title');
      assert.equal(
        english('meta[property="og:description"]').attr('content'),
        english('meta[name="description"]').attr('content'),
      );
      assert.equal(
        english('meta[property="og:url"]').attr('content'),
        'https://susanne-preiss.de/about-susanne/',
      );
      assert.equal(
        JSON.parse(english('script[type="application/ld+json"]').text()).url,
        'https://susanne-preiss.de/about-susanne/',
      );
      assert.equal(
        english('link[rel="canonical"]').attr('href'),
        'https://susanne-preiss.de/about-susanne/',
      );
      const alternates = ($: ReturnType<typeof load>) =>
        $('head link[hreflang]')
          .toArray()
          .map((el) => [$(el).attr('hreflang'), $(el).attr('href')]);
      assert.deepEqual(alternates(german), alternates(english));
      assert.equal(alternates(english).length, 3);
      assert.equal(english('nav[aria-label="Language"] a').attr('href'), '/ueber-mich/');
      assert.equal(german('nav[aria-label="Sprache"] a').attr('href'), '/about-susanne/');
      assert.equal(english('.utility-page').length, 0);
      assert.doesNotMatch(english('main').text(), /Strandweg|Datenschutz|SCHLIESSEN/);
      for (const [key, slug] of Object.entries(utilitySlugs)) {
        const page = await html(`${slug}/index.html`);
        assert.equal(page('html').attr('lang'), 'en');
        assert.match(page('main').text(), new RegExp(`Isolated English ${key} fixture`));
        assert.equal(page('main h1').length, 1);
        assert.equal(page('title').text(), `Fixture ${key}`);
        assert.equal(page('html').attr('data-page-kind'), 'utility');
        assert.equal(page('footer a').length, 1);
        assert.equal(page('#page-return').text(), 'Close');
        assert.equal(page('.site-header').length, 0);
        assert.equal(
          page('link[rel="canonical"]').attr('href'),
          `https://susanne-preiss.de/${slug}/`,
        );
        assert.equal(
          page('meta[name="description"]').attr('content'),
          `English ${key} description`,
        );
        assert.equal(page('nav[aria-label="Language"] a').attr('href'), germanUtilities[key]);
        assert.equal(
          page('link[hreflang="en"]').attr('href'),
          `https://susanne-preiss.de/${slug}/`,
        );
      }
      assert.deepEqual(
        english('.main-navigation a')
          .toArray()
          .map((el) => english(el).attr('href')),
        ['/about-susanne/'],
      );
      assert.deepEqual(
        german('.main-navigation a')
          .toArray()
          .map((el) => german(el).attr('href')),
        [
          '/',
          '/online-training/',
          '/workshops/',
          '/personalentwicklung/',
          '/regenerative-changemaker/',
          '/nachhaltigkeit/',
          '/business-coaching/',
          '/top-management-sparring/',
          '/key-note-speaker/',
          '/ueber-mich/',
          '/presse/',
        ],
      );
      for (const [$, destinations, labels] of [
        [
          german,
          germanUtilities,
          { contact: 'KONTAKT', imprint: 'IMPRESSUM', privacy: 'DATENSCHUTZ' },
        ],
        [
          english,
          Object.fromEntries(Object.entries(utilitySlugs).map(([key, slug]) => [key, `/${slug}/`])),
          englishStrings,
        ],
      ] as const) {
        assert.equal($('.site-footer > a.contact').attr('id'), 'footer-contact');
        assert.equal($('.site-footer > a.contact').attr('href'), destinations.contact);
        assert.equal(
          $('.site-footer > a.contact').text().toUpperCase(),
          labels.contact.toUpperCase(),
        );
        assert.deepEqual(
          $('.site-footer > .legal a')
            .toArray()
            .map((el) => [$(el).attr('id'), $(el).attr('href'), $(el).text().toUpperCase()]),
          [
            ['footer-imprint', destinations.imprint, labels.imprint.toUpperCase()],
            ['footer-privacy', destinations.privacy, labels.privacy.toUpperCase()],
          ],
        );
        assert.equal($('.main-navigation #footer-contact').length, 0);
      }
      const workshops = await html('workshops/index.html');
      assert.equal(workshops('[hreflang="en"]').length, 0);
      assert.equal(workshops('.language-links').length, 0);
      await assert.rejects(access(join(fixture, 'dist/en/training-workshops/index.html')));
      // Optional isolated browser handoff: never copy fixtures into production dist.
      if (process.env.NAVIGATION_FIXTURE_OUTPUT) {
        const output = resolve(process.env.NAVIGATION_FIXTURE_OUTPUT);
        await mkdir(output, { recursive: false });
        await cp(join(fixture, 'dist'), output, { recursive: true });
      }
      const navigationPath = join(fixture, 'content/settings/navigation.json');
      const originalNavigation = await readFile(navigationPath, 'utf8');
      await writeFile(
        navigationPath,
        JSON.stringify({ footerNavigation: { primary: 'contact', legal: ['privacy', 'imprint'] } }),
      );
      result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const reorderedFooter = await html('about-susanne/index.html');
      assert.deepEqual(
        reorderedFooter('.site-footer .legal a')
          .toArray()
          .map((el) => reorderedFooter(el).attr('id')),
        ['footer-privacy', 'footer-imprint'],
      );
      assert.equal(reorderedFooter('.site-footer > .contact').attr('id'), 'footer-contact');
      await writeFile(
        navigationPath,
        JSON.stringify({ footerNavigation: { primary: 'contact', legal: ['imprint', 'imprint'] } }),
      );
      result = build();
      assert.notEqual(result.status, 0);
      assert.match(result.stdout + result.stderr, /Duplicate legal footer reference/);
      await writeFile(navigationPath, originalNavigation);
      const englishPrivacy = join(fixture, 'content/shared/privacy-en.mdoc');
      const originalPrivacy = await readFile(englishPrivacy, 'utf8');
      await writeFile(
        englishPrivacy,
        originalPrivacy.replace('publication: published', 'publication: draft'),
      );
      result = build();
      assert.notEqual(result.status, 0);
      assert.match(result.stdout + result.stderr, /Missing published shared reference: privacy:en/);
      await writeFile(englishPrivacy, originalPrivacy);
      result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const redirect = await html('html/about.html');
      assert.equal(redirect('meta[http-equiv="refresh"]').attr('content'), '0;url=/ueber-mich/');
      assert.equal(redirect('body a').attr('href'), '/ueber-mich/');
      assert.equal(
        redirect('link[rel="canonical"]').attr('href'),
        'https://susanne-preiss.de/ueber-mich/',
      );
      const aboutPath = join(fixture, 'content/pages/de/about.mdoc');
      const original = await readFile(aboutPath, 'utf8');
      await writeFile(
        aboutPath,
        original
          .replace('title: "About Susanne Preiss"', 'title: "Markdown edit proof"')
          .replace('# About', '# Markdown prose edit proof'),
      );
      result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const edited = await html('ueber-mich/index.html');
      assert.equal(edited('title').text(), 'Markdown edit proof');
      assert.equal(edited('article h1').text(), 'Markdown prose edit proof');
      // Restore the temporary edit before exercising validation.
      await writeFile(aboutPath, original);
      await writeFile(aboutPath, original.replace(/^description:.*\n/m, ''));
      result = build();
      assert.notEqual(result.status, 0);
      assert.match(result.stdout + result.stderr, /description/);
      await writeFile(
        aboutPath,
        original.replace('title: "About Susanne Preiss"', 'title: [unterminated'),
      );
      result = build();
      assert.notEqual(result.status, 0);
      assert.match(result.stdout + result.stderr, /YAML|flow collection|comma/i);
      await writeFile(aboutPath, original);
      result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal((await html('ueber-mich/index.html'))('title').text(), 'About Susanne Preiss');
      await writeFile(
        aboutPath,
        original + '\n[Broken publication reference](/en/training-workshops/)\n',
      );
      result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const invalidLinks = validate();
      assert.notEqual(invalidLinks.status, 0);
      assert.match(invalidLinks.stdout + invalidLinks.stderr, /Not a published route/);
      await writeFile(aboutPath, original);

      const first = '{% prose key="first" %}\n\n## First editorial block\n\n{% /prose %}';
      const second = '{% prose key="second" %}\n\n## Second editorial block\n\n{% /prose %}';
      for (const blocks of [
        [first, second],
        [second, first],
      ]) {
        await writeFile(aboutPath, original + '\n' + blocks.join('\n\n'));
        result = build();
        assert.equal(result.status, 0, result.stdout + result.stderr);
        const editedOrder = await html('ueber-mich/index.html');
        assert.deepEqual(
          editedOrder('[data-section-key]')
            .toArray()
            .map((el) => editedOrder(el).attr('data-section-key')),
          blocks[0] === first ? ['first', 'second'] : ['second', 'first'],
        );
      }
      await writeFile(aboutPath, original);
      const englishAboutPath = join(fixture, 'content/pages/en/about.mdoc');
      const englishAbout = await readFile(englishAboutPath, 'utf8');
      await cp(
        join(fixture, 'public/pdf/online1.pdf'),
        join(fixture, 'public/pdf/english-course.pdf'),
      );
      await cp(
        join(fixture, 'src/assets/images/workshops_video2.jpg'),
        join(fixture, 'src/assets/images/english-poster.jpg'),
      );
      await mkdir(join(fixture, 'public/captions'), { recursive: true });
      await writeFile(
        join(fixture, 'public/captions/fixture-en.vtt'),
        'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nIsolated fixture caption, not a translation.\n',
      );
      await writeFile(
        englishAboutPath,
        englishAbout +
          `\n{% resource-list %}\n{% resource key="english-pdf" destination="/pdf/english-course.pdf" %}\n\n## English download\n\n{% /resource %}\n{% resource key="english-contact" destination="content:contact" %}\n\n## Localized contact\n\n{% /resource %}\n{% /resource-list %}\n\n{% video key="english-video" id="english-placement" title="English video" src="https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/0ca4xk0fr579ze1k/index.m3u8" poster="/img/english-poster.jpg" mediaLocale="de" captionSrc="/captions/fixture-en.vtt" captionLocale="en" captionLabel="Fixture English" transcript="content:contact" transcriptLocale="en" %}\n\n## English video\n\n{% /video %}\n`,
      );
      await sharp({
        create: {
          width: 96,
          height: 64,
          channels: 4,
          background: { r: 0, g: 128, b: 255, alpha: 0.5 },
        },
      })
        .png()
        .toFile(join(fixture, 'src/assets/images/transparent.png'));
      await writeFile(
        englishAboutPath,
        (await readFile(englishAboutPath, 'utf8')) +
          '\n{% illustration key="transparent-fixture" image="/img/transparent.png" alt="" /%}\n',
      );
      const parserProof =
        '\n{% prose key="parser-proof" %}\n\n## Break{% br /%}line\n\n**Strong** and *emphasis*. "Straight quotes" ... -- https://example.com\n\n1\\. Numbered paragraph\n\n- First\n- Second\n\n{% /prose %}\n';
      await writeFile(englishAboutPath, (await readFile(englishAboutPath, 'utf8')) + parserProof);
      result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const localized = await html('about-susanne/index.html');
      const transparent = localized('[data-section-key="transparent-fixture"]');
      assert.match(transparent.find('img').attr('src')!, /\.png$/);
      for (const element of transparent.find('[srcset]').toArray()) {
        for (const candidate of localized(element).attr('srcset')!.split(',')) {
          const url = candidate.trim().split(/\s+/)[0]!;
          const metadata = await sharp(join(fixture, 'dist', url.slice(1))).metadata();
          assert.equal(metadata.hasAlpha, true, `Transparency lost: ${url}`);
          assert.equal(metadata.width, 96, 'Small images are not upscaled');
          assert.equal(metadata.height, 64);
        }
      }
      const parser = localized('[data-section-key="parser-proof"]');
      assert.equal(parser.find('h2#breakline br').length, 1);
      assert.equal(parser.find('strong').text(), 'Strong');
      assert.equal(parser.find('em').text(), 'emphasis');
      assert.equal(parser.find('a, ol').length, 0);
      assert.equal(parser.find('ul li').length, 2);
      assert.match(parser.text(), /"Straight quotes" \.\.\. -- https:\/\/example.com/);
      assert.match(parser.text(), /1\. Numbered paragraph/);
      assert.equal(localized('article article').length, 0);
      assert.equal(localized('[data-section-key="english-contact"] a').attr('href'), '/contact/');
      assert.equal(
        localized('[data-section-key="english-pdf"] a').attr('href'),
        '/pdf/english-course.pdf',
      );
      assert.match(
        localized('#english-placement video').attr('poster')!,
        /^\/_astro\/english-poster\..*\.jpg$/,
      );
      assert.equal(localized('a[href*=".m3u8"]').length, 0);
      assert.match(localized('.editorial-video noscript').text(), /Enable JavaScript/);
      assert.equal(validate().status, 0);
      assert.equal(localized('#english-placement video').attr('lang'), 'de');
      assert.equal(localized('#english-placement track').attr('srclang'), 'en');
      assert.equal(localized('#english-placement .media-transcript').attr('href'), '/contact/');
      assert.equal(localized('#english-placement .media-transcript').attr('hreflang'), 'en');
      if (process.env.VIDEO_FIXTURE_OUTPUT) {
        const output = resolve(process.env.VIDEO_FIXTURE_OUTPUT);
        await mkdir(output, { recursive: false });
        await cp(join(fixture, 'dist'), output, { recursive: true });
      }
      await writeFile(englishAboutPath, englishAbout);

      const invalidBodies = [
        ['{% unknown /%}', /Undefined tag|Unsupported editorial tag/],
        [
          '{% illustration key="missing-image" image="/img/missing.jpg" alt="" /%}',
          /Missing or invalid image asset/,
        ],
        [
          '{% illustration key="missing-vector" image="/svg/missing.svg" alt="" /%}',
          /Missing or invalid image asset/,
        ],
        [
          '{% video key="missing-poster" id="missing-poster" title="Test" src="https://example.com/video.m3u8" poster="/img/missing.jpg" /%}',
          /Missing or invalid image asset/,
        ],
        ['<script>alert(1)</script>', /HTML is not allowed/],
        ['{% prose key=$runtime %}Text{% /prose %}', /literal values|key/],
        [
          '{% resource-list %}\n{% resource key="nested-link" destination="content:contact" %}\n\n[Link](https://example.com)\n\n{% /resource %}\n{% /resource-list %}',
          /nested links/,
        ],
        ['{% prose %}Text{% /prose %}', /key/],
        [
          '{% prose key="test" class="arbitrary" %}Text{% /prose %}',
          /Unrecognized key|Undefined attribute/,
        ],
        ['{% course key="test" destination="https://example.com" /%}', /image|alt/],
        [
          '{% illustration key="test" image="/img/about_start_2.jpg" alt="" side="middle" /%}',
          /side/,
        ],
        ['{% video key="test" id="test" title="Test" src="javascript:alert(1)" /%}', /src/],
        [
          '{% video key="test" id="test" title="Test" src="https://example.com/video.m3u8" captionSrc="/captions/fixture-en.vtt" /%}',
          /Captions require/,
        ],
        [
          '{% video key="test" id="test" title="Test" src="https://example.com/video.m3u8" transcript="content:contact" /%}',
          /Transcripts require/,
        ],
        [
          '{% video key="test" id="test" title="Test" src="https://example.com/video.m3u8" mediaLocale="fr" /%}',
          /mediaLocale/,
        ],
        [
          '{% video key="test" id="test" title="Test" src="https://example.com/video.m3u8" cover="talk" /%}',
          /coverImage/,
        ],
        ['{% resource key="test" destination="/pdf/online1.pdf" /%}', /Invalid nesting/],
        ['{% prose key="outer" %}\n{% prose key="inner" /%}\n{% /prose %}', /Invalid nesting/],
        [first + '\n' + first, /Duplicate editorial key/],
        ['{% partial file="../shared/de/privacy.mdoc" /%}', /Unsupported editorial tag/],
        [
          '{% resource-list %}\n{% resource key="test" destination="content:missing" /%}\n{% /resource-list %}',
          /Missing published content destination/,
        ],
        [
          '{% resource-list %}\n{% resource key="test" destination="content:workshops" /%}\n{% /resource-list %}',
          /Missing published content destination/,
        ],
      ] as const;
      for (const [body, message] of invalidBodies) {
        // English Workshops is draft; no German fallback is allowed.
        await writeFile(englishAboutPath, englishAbout + '\n' + body);
        result = build();
        assert.equal(result.error, undefined, `Build did not finish: ${body}: ${result.error}`);
        assert.notEqual(result.status, 0, `Expected failure: ${body}`);
        assert.match(result.stdout + result.stderr, message);
        t.diagnostic(`Rejected: ${body.split('\n')[0]}`);
      }
      await writeFile(englishAboutPath, englishAbout);
      for (const body of [
        '{% resource-list %}\n{% resource key="missing-pdf" destination="/pdf/missing.pdf" /%}\n{% /resource-list %}',
        '{% video key="missing-caption" id="missing-caption" title="Test" src="https://example.com/video.m3u8" captionSrc="/captions/missing.vtt" captionLocale="en" captionLabel="English" /%}',
      ]) {
        await writeFile(aboutPath, original + '\n' + body);
        result = build();
        assert.equal(result.status, 0, result.stdout + result.stderr);
        const missing = validate();
        assert.notEqual(missing.status, 0);
        assert.match(
          missing.stdout + missing.stderr,
          /ENOENT|Missing local asset|Missing download/,
        );
      }
      await writeFile(
        aboutPath,
        original +
          '\n{% video key="duplicate" id="duplicate-title" title="Fixture" src="https://example.com/video.m3u8" %}\n\n## Duplicate title\n\n{% /video %}\n',
      );
      result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const duplicate = validate();
      assert.notEqual(duplicate.status, 0);
      assert.match(duplicate.stdout + duplicate.stderr, /Duplicate HTML id/);
      await writeFile(aboutPath, original);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  },
);

test('production output excludes English fixtures and preserves About wording and destinations', async () => {
  const production = load(await readFile('dist/ueber-mich/index.html', 'utf8'));
  const legacy = load(await readFile('tests/fixtures/legacy/html/about.html', 'utf8'));
  const normalized = (value: string) => value.replace(/\s+/g, '');
  assert.equal(
    normalized(production('article').text()),
    normalized(legacy('.m-text-container').text()),
  );
  assert.deepEqual(
    production('article a')
      .toArray()
      .map((el) => production(el).attr('href')),
    legacy('.m-text-container a')
      .toArray()
      .map((el) => legacy(el).attr('href')),
  );
  assert.equal(production('[hreflang="en"]').length, 0);
  assert.equal(production('html').attr('lang'), 'de');
  assert.equal(production('html').attr('data-page-kind'), 'content');
  assert.equal(production('meta[name="astro-view-transitions-enabled"]').attr('content'), 'true');
  assert.equal(production('meta[name="astro-view-transitions-fallback"]').attr('content'), 'swap');
  assert.equal(production('main').attr('tabindex'), '-1');
  assert.equal(production('astro-island[component-export="default"]').length, 1);
  assert.equal(production('.language-links').length, 0);
  assert.equal(production('.main-navigation a[href="/ueber-mich/"]').length, 1);
  assert.equal(production('.utility-page').length, 0);
  for (const slug of ['kontakt', 'impressum', 'datenschutz']) {
    assert.equal(production(`.main-navigation a[href="/${slug}/"]`).length, 0);
    assert.equal(production(`.site-footer a[href="/${slug}/"]`).length, 1);
  }
  for (const [slug, original] of [
    ['kontakt', '.cont-form'],
    ['impressum', '.impressumPage'],
    ['datenschutz', '.datenschutzPage'],
  ]) {
    const page = load(await readFile(`dist/${slug}/index.html`, 'utf8'));
    assert.equal(page('main h1').length, 1);
    page('.sr-only').remove(); // New accessible contact heading, not a rewrite of the contact details.
    assert.equal(normalized(page('main').text()), normalized(legacy(original!).text()));
    assert.equal(page('link[rel="canonical"]').attr('href'), `https://susanne-preiss.de/${slug}/`);
    assert.equal(page('meta[name="robots"][content*="noindex"]').length, 0);
    assert.equal(page('html').attr('data-page-kind'), 'utility');
    assert.equal(page('footer a').length, 1);
    assert.equal(page('#page-return').text(), 'SCHLIESSEN');
    assert.equal(page('#page-return').attr('href'), '/');
    assert.equal(page('.site-header').length, 0);
    assert.equal(production(`footer a[href="/${slug}/"]`).length, 1);
  }
  await assert.rejects(access('dist/en'));
});
