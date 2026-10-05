import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { buildFixture, seedImageCache } from './fixture-build';
import { load } from 'cheerio';
import { english } from './fixtures/ui';

test(
  'authored routes build owner examples, path edits, aliases and collision failures',
  { timeout: 300_000 },
  async () => {
    const fixture = await mkdtemp(resolve('.fixture-paths-'));
    const build = () => buildFixture(fixture);
    const html = async (file: string) => load(await readFile(join(fixture, 'dist', file), 'utf8'));
    const success = () => {
      const result = build();
      assert.equal(result.status, 0, result.stdout + result.stderr);
    };
    const failure = (message: RegExp) => {
      const result = build();
      assert.notEqual(result.status, 0);
      assert.match(result.stdout + result.stderr, message);
    };
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
      const dictionary = join(fixture, 'content/ui.json');
      await writeFile(
        dictionary,
        JSON.stringify({ ...JSON.parse(await readFile(dictionary, 'utf8')), en: english }),
      );
      for (const [key, slug] of [
        ['contact', '/contact'],
        ['imprint', '/en/legal-notice'],
        ['privacy', '/legal/privacy-policy'],
      ]) {
        await writeFile(
          join(fixture, `content/shared/${key}-en.mdoc`),
          `---\ntranslationKey: ${key}\nlocale: en\npublication: published\ntitle: Fixture ${key}\nslug: ${slug}\ndescription: Isolated fixture\n---\n${key === 'contact' ? '' : `# Fixture ${key}`}\n\nEnglish test content.\n`,
        );
      }
      const home = await readFile(join(fixture, 'content/pages/de/home.mdoc'), 'utf8');
      const homeEnglish = join(fixture, 'content/pages/home-en.mdoc');
      // Isolated English homepage only: the production collections are never modified.
      const englishHome =
        home
          .slice(0, home.indexOf('\n---', 4) + 4)
          .replace(/locale:.*\n/, 'locale: en\n')
          .replace(/slug:.*\n/, 'slug: /en/\n') + '\n\n# English fixture home\n';
      await writeFile(
        homeEnglish,
        englishHome.replace('publication: published', 'publication: draft'),
      );
      // Original home uses unquoted publication. Guard against unnoticed fixture drift.
      assert.match(await readFile(homeEnglish, 'utf8'), /publication: draft/);
      success();
      await assert.rejects(access(join(fixture, 'dist/en/index.html')));
      await writeFile(homeEnglish, englishHome);
      const change = await readFile(join(fixture, 'content/pages/de/changemaker.mdoc'), 'utf8');
      await writeFile(
        join(fixture, 'content/pages/changemaker-en.mdoc'),
        change
          .replace('locale: "de"', 'locale: "en"')
          .replace('slug: "/regenerative-changemaker"', 'slug: "/en/regenerative-changemaker"'),
      );
      success();
      for (const [file, language] of [
        ['index.html', 'de'],
        ['en/index.html', 'en'],
        ['kontakt/index.html', 'de'],
        ['contact/index.html', 'en'],
        ['regenerative-changemaker/index.html', 'de'],
        ['en/regenerative-changemaker/index.html', 'en'],
      ]) {
        const $ = await html(file!);
        assert.equal($('html').attr('lang'), language);
        assert.equal($('meta[http-equiv="refresh"]').length, 0);
        assert.equal($('main').length, 1);
      }
      assert.equal((await html('contact/index.html'))('#page-return').attr('href'), '/en/');
      assert.equal(
        (await html('en/index.html'))('link[hreflang="x-default"]').attr('href'),
        'https://susanne-preiss.de/',
      );
      assert.equal(
        (await html('en/regenerative-changemaker/index.html'))('.editorial-video noscript')
          .text()
          .includes('Enable JavaScript'),
        true,
      );
      for (const [file, destination] of [
        ['de/index.html', '/'],
        ['de/regenerative-changemaker/index.html', '/regenerative-changemaker/'],
        ['html/changemaker.html', '/regenerative-changemaker/'],
      ]) {
        const $ = await html(file!);
        assert.equal($('meta[http-equiv="refresh"]').attr('content'), `0;url=${destination}`);
        assert.match($('script').text(), /window.location.hash/);
      }
      if (process.env.AUTHORED_FIXTURE_OUTPUT)
        await cp(join(fixture, 'dist'), resolve(process.env.AUTHORED_FIXTURE_OUTPUT), {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
      const about = join(fixture, 'content/pages/de/about.mdoc');
      const original = await readFile(about, 'utf8');
      await writeFile(about, original.replace('slug: "/ueber-mich"', 'slug: "/angebote/beratung"'));
      success();
      assert.equal(
        (await html('angebote/beratung/index.html'))('link[rel="canonical"]').attr('href'),
        'https://susanne-preiss.de/angebote/beratung/',
      );
      assert.equal((await html('html/about.html'))('body a').attr('href'), '/angebote/beratung/');
      assert.equal(
        (await html('de/ueber-mich/index.html'))('body a').attr('href'),
        '/angebote/beratung/',
      );
      for (const path of [
        '/kontakt/',
        '/contact',
        '/',
        '/en/',
        '/a/../b',
        '//external.test',
        '/a%2fb',
        '/a?b',
        '/a#b',
      ]) {
        await writeFile(about, original.replace('slug: "/ueber-mich"', `slug: "${path}"`));
        failure(/Duplicate route|Invalid authored path/);
      }
      await writeFile(
        about,
        original
          .replace('publication: "published"', 'publication: "draft"')
          .replace('slug: "/ueber-mich"', 'slug: "/de/kontakt/"'),
      );
      failure(/Duplicate output.*de\/kontakt\/index.html/);
      await writeFile(about, original);
      const asset = join(fixture, 'public/ueber-mich');
      await writeFile(asset, 'A public file cannot also be a page directory');
      failure(/Output file\/directory conflict/);
      await rm(asset);
      await writeFile(join(fixture, 'public/404.html'), 'Conflicting fixed output');
      failure(/Duplicate output.*404.html/);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  },
);
