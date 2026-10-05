import type { APIRoute } from 'astro';
import { publishedContent } from '../lib/content/published';

/** Only published canonical routes belong here; hreflang lives in the HTML head. */
export const GET: APIRoute = async ({ site }) => {
  const routes = await publishedContent(site);
  const urls = routes.published.map(({ data }) => {
    const href = routes.canonical(data.translationKey, data.locale);
    const escaped = href.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return `  <url><loc>${escaped}</loc></url>`;
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
