import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDiscovery } from '../scripts/validate-discovery';

const origin = 'https://susanne-preiss.de';
const de = `${origin}/ueber-mich/`;
const en = `${origin}/about-susanne/`;
const alternates = [
  { locale: 'de', href: de },
  { locale: 'en', href: en },
  { locale: 'x-default', href: de },
];
const pages = [
  { canonical: de, locale: 'de', alternates, noindex: false },
  { canonical: en, locale: 'en', alternates, noindex: false },
];
const sitemap = (urls: string[]) =>
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;

test('discovery accepts reciprocal translated canonicals and German-only publication', () => {
  validateDiscovery(pages, sitemap([de, en]), robots, origin);
  validateDiscovery(
    [{ ...pages[0]!, alternates: alternates.filter(({ locale }) => locale !== 'en') }],
    sitemap([de]),
    robots,
    origin,
  );
});

test('discovery rejects redirects, drafts, missing URLs and duplicate sitemap entries', () => {
  for (const urls of [
    [de],
    [de, en, `${origin}/html/about.html`],
    [de, en, `${origin}/draft/`],
    [de, de],
  ]) {
    assert.throws(
      () => validateDiscovery(pages, sitemap(urls), robots, origin),
      /published canonicals/,
    );
  }
});

test('discovery rejects blocked production and preview origin leakage', () => {
  assert.throws(
    () =>
      validateDiscovery(
        [{ ...pages[0]!, noindex: true }, pages[1]!],
        sitemap([de, en]),
        robots,
        origin,
      ),
    /Non-indexable/,
  );
  assert.throws(
    () =>
      validateDiscovery(
        pages,
        sitemap([de, en]),
        robots.replace('Allow: /', 'Disallow: /'),
        origin,
      ),
    /robots policy/,
  );
  assert.throws(
    () =>
      validateDiscovery(
        pages,
        sitemap([de, en]),
        robots.replace(origin, 'https://preview.workers.dev'),
        origin,
      ),
    /robots policy/,
  );
  assert.throws(
    () => validateDiscovery(pages, sitemap([de, en]), robots, 'https://preview.workers.dev'),
    /Non-indexable/,
  );
});

test('discovery rejects non-reciprocal, wrong-language and missing self alternates', () => {
  for (const invalid of [
    alternates.filter(({ locale }) => locale !== 'en'),
    alternates.map((item) => (item.locale === 'en' ? { ...item, href: de } : item)),
    [...alternates, alternates[0]!],
    alternates.map((item) => (item.locale === 'en' ? { ...item, locale: 'en-UK' } : item)),
  ]) {
    assert.throws(
      () =>
        validateDiscovery(
          [{ ...pages[0]!, alternates: invalid }, pages[1]!],
          sitemap([de, en]),
          robots,
          origin,
        ),
      /hreflang/,
    );
  }
  assert.throws(
    () => validateDiscovery([{ ...pages[0]!, alternates: [] }], sitemap([de]), robots, origin),
    /self hreflang/,
  );
  const germanOnly = [{ ...pages[0]!, alternates: [{ locale: 'de', href: de }] }];
  assert.throws(() => validateDiscovery(germanOnly, sitemap([de]), robots, origin), /x-default/);
});
