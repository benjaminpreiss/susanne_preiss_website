import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import sharp from 'sharp';
import { pageSchema } from '../src/lib/content/schema';

async function htmlFiles(directory: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map((entry) => {
        const file = join(directory, entry.name);
        return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
      }),
    )
  ).flat();
}

test('published pages have consistent metadata, semantic structure and valid social images', async () => {
  let count = 0;
  for (const file of await htmlFiles('dist')) {
    const $ = load(await readFile(file, 'utf8'));
    if (!$('main').length) continue;
    count++;
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');
    const canonical = $('link[rel="canonical"]').attr('href');
    assert.ok(title.trim() && description?.trim(), file);
    assert.equal($('main h1').length, 1, file);
    assert.equal($('main').attr('tabindex'), '-1');
    assert.equal($('meta[name="astro-view-transitions-enabled"]').attr('content'), 'true');
    assert.equal(
      $('a[href*=".m3u8"]').length,
      0,
      'Streaming manifests are not visitor-facing links',
    );
    for (const prefix of ['og', 'twitter']) {
      const attribute = prefix === 'og' ? 'property' : 'name';
      assert.equal($(`meta[${attribute}="${prefix}:title"]`).attr('content'), title);
      assert.equal($(`meta[${attribute}="${prefix}:description"]`).attr('content'), description);
      assert.ok($(`meta[${attribute}="${prefix}:image:alt"]`).attr('content')?.trim());
    }
    assert.equal($('meta[property="og:url"]').attr('content'), canonical);
    const image = new URL($('meta[property="og:image"]').attr('content')!);
    assert.equal(image.origin, new URL(canonical!).origin);
    assert.equal($('meta[name="twitter:image"]').attr('content'), image.href);
    const filePath = join('dist', image.pathname);
    assert.ok((await stat(filePath)).isFile());
    const dimensions = await sharp(filePath).metadata();
    assert.equal(dimensions.format, 'jpeg');
    assert.equal(dimensions.width, Number($('meta[property="og:image:width"]').attr('content')));
    assert.equal(dimensions.height, Number($('meta[property="og:image:height"]').attr('content')));

    // Optional metadata is checked when present, not prescribed per named page.
    assert.ok($('script[type="application/ld+json"]').length <= 1);
    for (const script of $('script[type="application/ld+json"]').toArray()) {
      const entity = JSON.parse($(script).text());
      assert.equal(entity['@context'], 'https://schema.org');
      assert.ok(['Person', 'WebSite', 'Service', 'Course'].includes(entity['@type']));
      assert.ok(entity.name?.trim());
      assert.equal(entity.url, canonical);
      assert.equal(new URL(entity['@id']).origin, new URL(canonical!).origin);
      if (entity['@type'] === 'Service' || entity['@type'] === 'Course') {
        assert.ok(entity.description?.trim());
        assert.equal(entity.provider['@type'], 'Person');
        assert.ok(entity.provider.name?.trim());
      }
    }
    if ($('html').attr('data-page-kind') === 'utility') {
      assert.equal($('.site-header').length, 0);
      assert.equal($('#page-return').length, 1);
      assert.ok($('#page-return').attr('href'));
    }
  }
  assert.ok(count > 0, 'No published pages were checked');
});

test('editorial entity metadata permits only explicit, complete Service/Course descriptions', () => {
  const schema = pageSchema.shape.structuredData;
  assert.equal(schema.parse(undefined), undefined);
  for (const type of ['Service', 'Course']) {
    assert.deepEqual(schema.parse({ type, name: 'Test', description: 'Visible content' }), {
      type,
      name: 'Test',
      description: 'Visible content',
    });
  }
  for (const invalid of [
    { type: 'Review', name: 'Test', description: 'Test' },
    { type: 'Service', name: ' ', description: 'Test' },
    { type: 'Course', name: 'Test' },
    { type: 'Service', name: 'Test', description: 'Test', aggregateRating: 5 },
  ])
    assert.equal(schema.safeParse(invalid).success, false);
});
