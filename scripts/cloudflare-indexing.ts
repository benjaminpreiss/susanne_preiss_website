import { access, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Select deployment headers without rebuilding or changing the source/preview policy. */
export async function setCloudflareIndexing(mode: string | undefined, root = resolve('dist')) {
  if (mode !== 'index' && mode !== 'noindex')
    throw new Error('Expected indexing mode: index or noindex');

  // Do not create a partial output directory when the build has not run.
  await access(join(root, 'index.html'));
  await access(join(root, '404.html'));
  await access(join(root, '_headers'));
  const baseline = await readFile(resolve('public/_headers'), 'utf8');
  const headers =
    mode === 'noindex'
      ? `${baseline.trimEnd()}\n\n# Production verification: allow crawling, but prevent indexing.\n/*\n  X-Robots-Tag: noindex\n`
      : baseline;
  // Always regenerate from source so repeated runs and noindex -> index are reversible.
  await writeFile(join(root, '_headers'), headers);
  console.log(`Cloudflare production indexing: ${mode}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await setCloudflareIndexing(process.argv[2]);
