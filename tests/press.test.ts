import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { assertLegacyAsset } from './legacy-assertions';
import { assertOptimizedReference, assertOriginalPreserved } from './image-assertions';

const compact = (value: string) => value.replace(/\s+/g, '');
test('Presse preserves German copy, ordered resources, metadata and original assets', async () => {
  const before = load(await readFile('tests/fixtures/legacy/html/presse.html', 'utf8'));
  const after = load(await readFile('dist/presse/index.html', 'utf8'));
  before('.content svg').remove(); // Decoration/style text is not editorial copy.
  assert.equal(after('html').attr('lang'), 'de');
  assert.equal(after('title').text(), before('title').text());
  assert.equal(
    compact(after('meta[name="description"]').attr('content')!),
    compact(before('meta[name="description"]').attr('content')!),
  );
  assert.equal(after('link[rel="canonical"]').attr('href'), 'https://susanne-preiss.de/presse/');
  assert.equal(after('[hreflang="en"]').length, 0);
  assert.equal(after('main h1').length, 1);
  assert.equal(after('main video').length, 0, 'Do not invent Presse media');
  assert.equal(
    compact(after('[data-section-key="press-intro"]').text()),
    compact(before('.content .text').text()),
  );
  const original = before('.content a.article').toArray();
  const resources = after('.resource-card a').toArray();
  assert.equal(resources.length, 14);
  assert.deepEqual(
    resources.map((el) => after(el).attr('href')),
    original.map((el) => before(el).attr('href')!.replace('../', '/')),
  );
  for (const [index, el] of resources.entries()) {
    const card = after(el);
    assert.equal(
      compact(card.text()),
      compact(before(original[index]).find('.m-article-text').text()),
    );
    assert.equal(card.attr('target'), '_blank');
    assert.equal(card.attr('rel'), 'noreferrer noopener');
    const pdf = card.attr('href')!;
    const image = card.find('img').attr('src')!;
    assert.equal(image, pdf.replace('/pdf/', '/svg/').replace('.pdf', '.svg'));
    for (const asset of [pdf, image]) assertLegacyAsset(await readFile(`public${asset}`), asset);
    assert.equal((await readFile(`public${pdf}`, 'utf8')).slice(0, 5), '%PDF-');
  }
  assertOptimizedReference(after('.hero img').attr('src'), '/img/presse_start.jpg');
  await assertOriginalPreserved('/img/presse_start.jpg');
  for (const slug of ['kontakt', 'impressum', 'datenschutz'])
    assert.ok(after(`.site-footer a[href="/${slug}/"]`).length);
  const redirect = load(await readFile('dist/html/presse.html', 'utf8'));
  assert.equal(redirect('meta[http-equiv="refresh"]').attr('content'), '0;url=/presse/');
});
