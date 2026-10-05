import { getCollection } from 'astro:content';
import { readdir } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createRoutes } from './routes';
import { createAliases } from './aliases';
import { pageOutput, validateOutputClaims } from './paths';
import { ui } from './ui';
import legacyRoutes from '../../../content/settings/legacy-routes.json';

async function publicFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? publicFiles(join(directory, entry.name))
          : [join(directory, entry.name)],
      ),
    )
  ).flat();
}

export async function publishedContent(site: URL | undefined) {
  if (!site) throw new Error('Production site origin is required');
  const [pages, shared] = await Promise.all([getCollection('pages'), getCollection('shared')]);
  const publicRoot = resolve('public');
  const reserved = [
    { file: '404.html', owner: 'fixed 404 page' },
    ...(await publicFiles(publicRoot)).map((file) => ({
      file: relative(publicRoot, file),
      owner: 'public asset',
    })),
  ];
  const routes = createRoutes(pages, shared, ui, site.href, reserved);
  const aliases = createAliases(routes, legacyRoutes);
  validateOutputClaims([
    ...reserved,
    ...[...pages, ...shared].map((entry) => ({
      file: pageOutput(routes.path(entry.data)),
      owner: `${entry.data.translationKey}:${entry.data.locale}`,
    })),
    ...aliases.map((alias) => ({ file: alias.file, owner: `alias ${alias.path}` })),
  ]);
  return { ...routes, aliases };
}
