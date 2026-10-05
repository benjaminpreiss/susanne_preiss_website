import type { APIRoute } from 'astro';

/** Production is crawlable. Preview noindex/access protection is a hosting concern. */
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Production site origin is required');
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
};
