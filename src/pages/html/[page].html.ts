import type { APIRoute } from 'astro';
import { redirectDocument } from '../../lib/content/redirect';
import { publishedContent } from '../../lib/content/published';
export const prerender = true;
export async function getStaticPaths() {
  const routes = await publishedContent(new URL(import.meta.env.SITE));
  return routes.aliases
    .filter((alias) => alias.path.startsWith('/html/'))
    .map((alias) => ({
      params: { page: alias.path.slice('/html/'.length, -'.html'.length) },
      props: { destination: alias.destination },
    }));
}
export const GET: APIRoute = ({ props, site }) => {
  if (typeof props.destination !== 'string') throw new Error('Missing redirect destination');
  return new Response(redirectDocument(props.destination, site), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
