import type { APIRoute } from 'astro';
import { publishedContent } from '../lib/content/published';

// Astro ignores underscore-prefixed page filenames; emit this through a fixed
// prerendered parameter rather than treating _redirects as an application route.
export function getStaticPaths() {
  return [{ params: { hostConfig: '_redirects' } }];
}

export const GET: APIRoute = async ({ site }) => {
  const routes = await publishedContent(site);
  const rules = new Map<string, string>();
  for (const alias of routes.aliases) {
    rules.set(alias.path, alias.destination);
    if (alias.path.endsWith('/')) rules.set(alias.path.slice(0, -1), alias.destination);
  }
  for (const entry of routes.published) {
    const path = routes.path(entry.data);
    if (path !== '/') rules.set(path.slice(0, -1), path);
    rules.set(path + 'index.html', path);
  }
  return new Response([...rules].map(([from, to]) => `${from} ${to} 301`).join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain' },
  });
};
