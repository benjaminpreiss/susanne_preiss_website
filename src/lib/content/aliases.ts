import type { createRoutes } from './routes';
import { pageOutput } from './paths';

interface Mapping {
  key: string;
  legacy: string[];
}
export function createAliases(routes: ReturnType<typeof createRoutes>, mappings: Mapping[]) {
  const canonicalOutputs = new Set(
    routes.published.map((entry) => pageOutput(routes.path(entry.data))),
  );
  const claimed = new Map<string, string>();
  return mappings.flatMap((mapping) => {
    const destination = routes.resolve(mapping.key, 'de');
    if (!destination) return [];
    return mapping.legacy.flatMap((path) => {
      if (!/^\/(?:[a-z0-9/-]*|(?:html\/)?[a-z0-9-]+\.html)$/.test(path))
        throw new Error(`Invalid legacy alias: ${path}`);
      const file = path.endsWith('.html') ? path.slice(1) : pageOutput(path);
      // / and /index.html are the same physical document. Content always wins.
      if (canonicalOutputs.has(file)) return [];
      const existing = claimed.get(file);
      if (existing && existing !== destination)
        throw new Error(`Conflicting legacy aliases for ${file}`);
      if (existing) return [];
      claimed.set(file, destination);
      return [{ path, file, destination }];
    });
  });
}
