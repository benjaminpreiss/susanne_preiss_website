import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import sharp from 'sharp';
import { pageSchema } from '../src/lib/content/schema';
import { descriptions as reviewedDescriptions } from './fixtures/seo';

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

test('production social metadata uses unique editorial copy, canonical URLs and a real portrait', async () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  let count = 0;
  for (const file of await htmlFiles('dist')) {
    const $ = load(await readFile(file, 'utf8'));
    if (!$('main').length) continue;
    count++;
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');
    const canonical = $('link[rel="canonical"]').attr('href');
    assert.ok(title && description);
    assert.equal(description, reviewedDescriptions[new URL(canonical!).pathname], file);
    assert.ok(!titles.has(title), `Duplicate title: ${file}`);
    assert.ok(!descriptions.has(description), `Duplicate description: ${file}`);
    titles.add(title);
    descriptions.add(description);
    for (const prefix of ['og', 'twitter']) {
      const attribute = prefix === 'og' ? 'property' : 'name';
      assert.equal($(`meta[${attribute}="${prefix}:title"]`).attr('content'), title);
      assert.equal($(`meta[${attribute}="${prefix}:description"]`).attr('content'), description);
      assert.equal($(`meta[${attribute}="${prefix}:image:alt"]`).attr('content'), 'Susanne Preiss');
    }
    assert.equal($('meta[property="og:url"]').attr('content'), canonical);
    const image = new URL($('meta[property="og:image"]').attr('content')!);
    assert.equal(image.origin, 'https://susanne-preiss.de');
    assert.equal($('meta[name="twitter:image"]').attr('content'), image.href);
    const filePath = join('dist', image.pathname);
    assert.ok((await stat(filePath)).isFile());
    const dimensions = await sharp(filePath).metadata();
    assert.equal(dimensions.format, 'jpeg');
    assert.equal(dimensions.width, Number($('meta[property="og:image:width"]').attr('content')));
    assert.equal(dimensions.height, Number($('meta[property="og:image:height"]').attr('content')));
    assert.equal($('[hreflang="en"]').length, 0);
  }
  assert.equal(count, 14);
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

test('Service and Course entities use canonical identities and the factual Person provider', async () => {
  for (const [slug, type, name] of [
    ['business-coaching', 'Service', 'Business Coaching'],
    ['top-management-sparring', 'Service', 'Top Management Sparring'],
    ['personalentwicklung', 'Service', 'Personalentwicklung'],
    ['key-note-speaker', 'Service', 'Key Note Speaker'],
    ['nachhaltigkeit', 'Service', 'Nachhaltigkeits-Coaching'],
    ['online-training', 'Course', '8 Module für virtuelle Führung'],
  ]) {
    const $ = load(await readFile(`dist/${slug}/index.html`, 'utf8'));
    assert.equal($('script[type="application/ld+json"]').length, 1);
    const entity = JSON.parse($('script[type="application/ld+json"]').text());
    const canonical = $('link[rel="canonical"]').attr('href');
    assert.equal(entity['@context'], 'https://schema.org');
    assert.equal(entity['@type'], type);
    assert.equal(entity['@id'], `${canonical}#${type!.toLowerCase()}`);
    assert.equal(entity.url, canonical);
    assert.equal(entity.name, name);
    assert.ok(entity.description.trim().length > 30);
    assert.deepEqual(entity.provider, {
      '@type': 'Person',
      '@id': 'https://susanne-preiss.de/#person',
      name: 'Susanne Preiss',
    });
    assert.deepEqual(
      Object.keys(entity).sort(),
      ['@context', '@type', '@id', 'name', 'description', 'url', 'provider'].sort(),
    );
  }
  for (const slug of [
    'workshops',
    'regenerative-changemaker',
    'presse',
    'kontakt',
    'impressum',
    'datenschutz',
  ]) {
    const $ = load(await readFile(`dist/${slug}/index.html`, 'utf8'));
    assert.equal(
      $('script[type="application/ld+json"]').length,
      0,
      `Unsubstantiated entity on ${slug}`,
    );
  }
});

test('JSON-LD describes only the visible site identity and About person without invented claims', async () => {
  for (const [file, expected] of [
    [
      'dist/index.html',
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://susanne-preiss.de/#website',
        name: 'Susanne Preiss',
        url: 'https://susanne-preiss.de/',
        inLanguage: 'de',
      },
    ],
    [
      'dist/ueber-mich/index.html',
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': 'https://susanne-preiss.de/#person',
        name: 'Susanne Preiss',
        url: 'https://susanne-preiss.de/ueber-mich/',
      },
    ],
  ] as const) {
    const $ = load(await readFile(file, 'utf8'));
    assert.equal($('script[type="application/ld+json"]').length, 1);
    const data = JSON.parse($('script[type="application/ld+json"]').text());
    if (data['@type'] === 'Person') {
      assert.equal(data.image, $('meta[property="og:image"]').attr('content'));
      delete data.image;
    }
    assert.deepEqual(data, expected);
  }
});
