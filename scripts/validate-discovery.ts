import { load } from 'cheerio';

interface Page {
  canonical: string;
  locale: string;
  alternates: { locale: string; href: string }[];
  noindex: boolean;
}

/** Check generated discovery signals against actual published HTML, not a second route list. */
export function validateDiscovery(
  pages: Page[],
  sitemap: string,
  robots: string,
  origin: string,
): void {
  const canonicalPages = new Map(pages.map((page) => [page.canonical, page]));
  for (const page of pages) {
    if (new URL(page.canonical).origin !== origin || page.noindex)
      throw new Error(`Non-indexable production canonical: ${page.canonical}`);
    const languages = new Set<string>();
    for (const alternate of page.alternates) {
      if (!['de', 'en', 'x-default'].includes(alternate.locale) || languages.has(alternate.locale))
        throw new Error(`Invalid or duplicate hreflang: ${page.canonical}`);
      languages.add(alternate.locale);
      const target = canonicalPages.get(alternate.href);
      if (!target || target.locale !== (alternate.locale === 'x-default' ? 'de' : alternate.locale))
        throw new Error(`Non-canonical hreflang destination: ${alternate.href}`);
      const normalized = (values: Page['alternates']) =>
        values
          .map(({ locale, href }) => `${locale}:${href}`)
          .sort()
          .join('\n');
      if (normalized(page.alternates) !== normalized(target.alternates))
        throw new Error(`Non-reciprocal hreflang: ${page.canonical}`);
    }
    if (
      !page.alternates.some(({ locale, href }) => locale === page.locale && href === page.canonical)
    )
      throw new Error(`Missing self hreflang: ${page.canonical}`);
    const german = page.alternates.find(({ locale }) => locale === 'de');
    if (
      german &&
      !page.alternates.some(({ locale, href }) => locale === 'x-default' && href === german.href)
    )
      throw new Error(`Missing German x-default: ${page.canonical}`);
  }
  const xml = load(sitemap, { xml: true });
  if (xml('urlset').attr('xmlns') !== 'http://www.sitemaps.org/schemas/sitemap/0.9')
    throw new Error('Missing sitemap namespace');
  const locations = xml('urlset > url > loc')
    .toArray()
    .map((element) => xml(element).text());
  if (
    new Set(locations).size !== locations.length ||
    locations.length !== pages.length ||
    locations.some((href) => !canonicalPages.has(href))
  )
    throw new Error('Sitemap must contain exactly the published canonicals');
  // This deliberately narrow policy prevents accidental production blocks or preview origins.
  const expected = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  if (robots !== expected) throw new Error('Unexpected production robots policy');
}
