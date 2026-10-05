import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { assertOptimizedReference, assertOriginalPreserved } from './image-assertions';

const pages = [
  ['personal', 'personalentwicklung'],
  ['business', 'business-coaching'],
  ['sparring', 'top-management-sparring'],
  ['speaker', 'key-note-speaker'],
];
const compact = (text: string) => text.replace(/\s+/g, '');
for (const [legacy, slug] of pages)
  test(`${slug}: built editorial parity, metadata, assets, redirects and media placement`, async () => {
    const before = load(await readFile(`tests/fixtures/legacy/html/${legacy}.html`, 'utf8'));
    const after = load(await readFile(`dist/${slug}/index.html`, 'utf8'));
    const sourceBlocks = before('.content > div')
      .toArray()
      .slice(1)
      .map((el) => before(el).find('.text, .m-half-cover-left').text());
    const targetBlocks = after('[data-section-key]')
      .toArray()
      .map((el) =>
        after(el).find('.prose').length ? after(el).find('.prose').text() : after(el).text(),
      );
    assert.deepEqual(targetBlocks.map(compact), sourceBlocks.map(compact));
    assert.equal(after('title').text(), before('title').text());
    assert.equal(
      compact(after('meta[name="description"]').attr('content')!),
      compact(before('meta[name="description"]').attr('content')!),
    );
    assert.equal(after('html').attr('lang'), 'de');
    assert.equal(after('main h1').length, 1);
    assert.equal(after('link[rel="canonical"]').attr('href'), `https://susanne-preiss.de/${slug}/`);
    assert.equal(after('[hreflang="en"]').length, 0);
    assert.equal(after('.language-links').length, 0);
    assert.deepEqual(
      after('.editorial-section a')
        .toArray()
        .map((el) => after(el).attr('href')),
      before('.content .text a')
        .toArray()
        .map((el) => before(el).attr('href')),
    );
    assertOptimizedReference(after('.hero img').attr('src'), `/img/${legacy}_start.jpg`);
    await assertOriginalPreserved(`/img/${legacy}_start.jpg`);
    const redirect = load(await readFile(`dist/html/${legacy}.html`, 'utf8'));
    assert.equal(redirect('meta[http-equiv="refresh"]').attr('content'), `0;url=/${slug}/`);
    assert.equal(redirect('body a').attr('href'), `/${slug}/`);
    const originalMedia = before('.content video')
      .toArray()
      .map((el) => ({
        id: before(el).attr('id'),
        src: before(el).find('source').attr('src'),
        poster: before(el).attr('poster')!.replace('../', '/'),
      }));
    const media = after('main video')
      .toArray()
      .map((el) => ({
        id: after(el).closest('.editorial-video').attr('id'),
        src: after(el).find('source').attr('src'),
        poster: after(el).attr('poster'),
      }));
    assert.deepEqual(
      media.map(({ id, src }) => ({ id, src })),
      originalMedia.map(({ id, src }) => ({ id, src })),
    );
    for (const [index, item] of media.entries()) {
      const original = originalMedia[index];
      assert.ok(original);
      assertOptimizedReference(item.poster, original.poster);
      await assertOriginalPreserved(original.poster);
      assert.ok((await readFile(`dist${item.poster}`)).length);
    }
    assert.equal(
      after('a[href*=".m3u8"]').length,
      0,
      'Streaming manifests are not visitor-facing links',
    );
  });

// Composition ordering and negative tag/reference cases are tested through real builds
// in build.test.ts rather than the retired section-collection dispatcher.
