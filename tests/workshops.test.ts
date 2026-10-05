import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { descriptions } from './fixtures/seo';
import { assertLegacyAsset } from './legacy-assertions';
import { assertOptimizedReference, assertOriginalPreserved } from './image-assertions';
import { editorialSchemas } from '../src/lib/content/editorial';
const pages = [
  ['workshops', 'workshops'],
  ['online', 'online-training'],
  ['changemaker', 'regenerative-changemaker'],
  ['nachhaltigkeit', 'nachhaltigkeit'],
] as const;
const compact = (text: string) => text.replace(/\s+/g, '');
for (const [legacy, slug] of pages)
  test(`${slug}: legacy prose, resources, layouts, metadata and media references`, async () => {
    const before = load(await readFile(`tests/fixtures/legacy/html/${legacy}.html`, 'utf8'));
    const after = load(await readFile(`dist/${slug}/index.html`, 'utf8'));
    before('svg, .vjs-no-js').remove();
    const expected = before('body > .content')
      .find('h3,h4,h6,p')
      .toArray()
      .map((el) => compact(before(el).text()))
      .filter(Boolean);
    const actual = after('main')
      .find('h1,h2,h3,p')
      .toArray()
      .map((el) => compact(after(el).text()))
      .filter(Boolean);
    assert.deepEqual(actual, expected, 'Editorial block order and wording');
    const headingLines = ($: ReturnType<typeof load>, selector: string) =>
      $(selector)
        .toArray()
        .map((el) => {
          const heading = $(el).clone();
          heading.find('br').replaceWith('|BREAK|');
          // Legacy heading spans are display:block; source newlines are just whitespace.
          heading.find('span').each((_, span) => {
            $(span).after('|BREAK|');
          });
          return heading.text().split('|BREAK|').map(compact).filter(Boolean);
        });
    assert.deepEqual(
      headingLines(after, 'main h1, main h2, main h3'),
      headingLines(before, 'body > .content h3, body > .content h4'),
      'Explicit editorial heading breaks',
    );
    for (const emphasis of before('body > .content b, body > .content strong').toArray()) {
      assert.ok(
        after('main strong')
          .toArray()
          .some((el) => compact(after(el).text()) === compact(before(emphasis).text())),
        `Preserved emphasis: ${before(emphasis).text()}`,
      );
    }
    // Ticket 11 corrects the Changemaker metadata copied from Personalentwicklung.
    // Body-copy, order, heading breaks and media parity remain independently asserted.
    assert.equal(
      after('title').text(),
      legacy === 'changemaker'
        ? 'Regenerative Changemaker – Susanne Preiss'
        : before('title').text(),
    );
    assert.equal(
      compact(after('meta[name="description"]').attr('content')!),
      compact(descriptions[`/${slug}/`]!),
    );
    assert.equal(after('html').attr('lang'), 'de');
    assert.equal(after('main h1').length, 1);
    assert.equal(after('link[rel="canonical"]').attr('href'), `https://susanne-preiss.de/${slug}/`);
    assert.equal(after('[hreflang="en"], .language-links').length, 0);
    assert.equal(after('astro-island').length, 1 + before('body > .content video').length);
    for (const anchor of after('.main-navigation a').toArray())
      assert.doesNotMatch(after(anchor).attr('href')!, /^\/de\//);
    const expectedLinks = before('body > .content a')
      .toArray()
      .map((el) => before(el).attr('href')!.replace('../pdf/', '/pdf/'));
    assert.deepEqual(
      after('main a')
        .toArray()
        .map((el) => after(el).attr('href')),
      expectedLinks,
    );
    for (const anchor of after('main a[href^="/pdf/"]').toArray()) {
      const href = after(anchor).attr('href')!;
      const bytes = await readFile(`dist${href}`);
      assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
      assertLegacyAsset(bytes, href);
      assert.equal(after(anchor).attr('target'), '_blank');
      assert.match(after(anchor).attr('rel')!, /noopener/);
    }
    for (const img of after('main img').toArray()) {
      const src = after(img).attr('src')!;
      if (src.startsWith('/svg/')) assertLegacyAsset(await readFile(`dist${src}`), src);
      else {
        assert.match(src, /^\/_astro\//);
        assert.ok((await readFile(`dist${src}`)).length);
      }
    }
    const sources = ($: ReturnType<typeof load>, selector: string) =>
      $(selector)
        .toArray()
        .map((el) => ({
          id: $(el).attr('id') ?? $(el).closest('.editorial-video').attr('id'),
          src: $(el).find('source').attr('src'),
          poster: $(el).attr('poster')?.replace('../', '/'),
        }));
    const actualMedia = sources(after, 'main video');
    const originalMedia = sources(before, 'body > .content video');
    assert.deepEqual(
      actualMedia.map(({ id, src }) => ({ id, src })),
      originalMedia.map(({ id, src }) => ({ id, src })),
    );
    for (const [index, item] of actualMedia.entries()) {
      const original = originalMedia[index];
      assert.ok(original);
      if (original.poster) assertOptimizedReference(item.poster, original.poster);
      else assert.equal(item.poster, undefined);
    }
    assert.equal(
      after('a[href*=".m3u8"]').length,
      0,
      'Streaming manifests are not visitor-facing links',
    );
    const redirect = load(await readFile(`dist/html/${legacy}.html`, 'utf8'));
    assert.equal(redirect('meta[http-equiv="refresh"]').attr('content'), `0;url=/${slug}/`);
    if (legacy === 'workshops') {
      assert.equal(after('.course-panel').length, 2);
      assert.equal(after('.course-cover.cover-right').length, 1);
      assert.equal(after('.course-cover.cover-left').length, 1);
      assert.equal(after('.centered-heading').text().trim(), 'Kurse.');
    }
    if (legacy === 'changemaker') {
      assert.equal(after('.illustration-panel').length, 2);
      assert.equal(after('.resource-article img').attr('src'), '/svg/deep_3.svg');
      await assertOriginalPreserved('/img/tedx_videoposter.jpg');
    }
  });
test('resource/media attributes reject incomplete layouts and unsafe destinations', () => {
  const base = { key: 'resource-1', destination: '/pdf/english-course.pdf' };
  assert.ok(editorialSchemas.resource.safeParse(base).success);
  for (const destination of [
    'javascript:alert(1)',
    '//external.test/a',
    '/pdf/../private.pdf',
    '/de/missing/',
  ])
    assert.equal(editorialSchemas.resource.safeParse({ ...base, destination }).success, false);
  assert.equal(
    editorialSchemas.resource.safeParse({ ...base, destination: undefined }).success,
    false,
  );
  assert.equal(editorialSchemas.course.safeParse(base).success, false);
  assert.equal(editorialSchemas.prose.safeParse(base).success, false);
  assert.ok(
    editorialSchemas.course.safeParse({ ...base, image: '/img/english.jpg', alt: '', side: 'left' })
      .success,
  );
});
