import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { load } from 'cheerio';
import { pageOutput, normalizePath } from '../src/lib/content/paths';

const root = resolve('dist');
async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
      ),
    )
  ).flat();
}
const documents = await Promise.all(
  (await files(root))
    .filter((file) => file.endsWith('.html'))
    .map(async (file) => ({ file, $: load(await readFile(file, 'utf8')) })),
);
const published = documents.filter(({ $ }) => $('main').length);
const canonicals = new Map<string, (typeof documents)[number]>();
for (const doc of published) {
  const canonical = new URL(doc.$('link[rel="canonical"]').attr('href')!);
  if (
    canonical.pathname !== normalizePath(canonical.pathname) ||
    doc.file !== join(root, pageOutput(canonical.pathname))
  ) {
    throw new Error(
      `Canonical does not identify its directory-index output: ${canonical.href} in ${doc.file}`,
    );
  }
  if (canonicals.has(canonical.pathname))
    throw new Error(`Duplicate built canonical: ${canonical.pathname}`);
  if (!['de', 'en'].includes(doc.$('html').attr('lang') ?? ''))
    throw new Error(`Missing explicit page locale: ${doc.file}`);
  canonicals.set(canonical.pathname, doc);
}
if (!canonicals.size) throw new Error('No published content built');
for (const { file, $ } of documents) {
  for (const element of $(
    '[src], [poster], link[rel="stylesheet"][href], link[rel="icon"][href]',
  ).toArray()) {
    for (const attribute of ['src', 'poster', 'href']) {
      const url = $(element).attr(attribute);
      if (!url?.startsWith('/')) continue;
      const asset = resolve(root, '.' + url);
      if (!asset.startsWith(root + '/') || !(await stat(asset)).isFile())
        throw new Error(`Missing local asset: ${url} in ${file}`);
    }
  }
  for (const element of $('[srcset]').toArray()) {
    for (const candidate of $(element).attr('srcset')!.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (!url?.startsWith('/')) continue;
      const asset = resolve(root, '.' + url);
      if (!asset.startsWith(root + '/') || !(await stat(asset)).isFile())
        throw new Error(`Missing srcset asset: ${url} in ${file}`);
    }
  }
  if ($('main').length) {
    const ids = new Set<string>();
    for (const element of $('[id]').toArray()) {
      const id = $(element).attr('id')!;
      if (ids.has(id)) throw new Error(`Duplicate HTML id: ${id} in ${file}`);
      ids.add(id);
    }
    if ($('main h1').length !== 1) throw new Error(`Expected one main heading: ${file}`);
    if (!$('meta[name="description"]').attr('content')?.trim())
      throw new Error(`Missing description: ${file}`);
    if ($('link[rel="canonical"]').length !== 1) throw new Error(`Expected one canonical: ${file}`);
  }
  for (const element of $(
    $('main').length
      ? 'a[href], link[rel="alternate"][hreflang]'
      : 'link[rel="alternate"][hreflang]',
  ).toArray()) {
    const href = $(element).attr('href')!;
    const canonical = $('link[rel="canonical"]').attr('href')!;
    const url = new URL(href, canonical);
    if (url.origin !== new URL(canonical).origin) continue;
    if (url.pathname.startsWith('/pdf/')) {
      if (!(await stat(resolve(root, '.' + url.pathname))).isFile())
        throw new Error(`Missing download: ${href}`);
      continue;
    }
    const target = canonicals.get(url.pathname);
    if (!target) throw new Error(`Not a published route: ${href} in ${file}`);
    if (
      url.hash &&
      !target
        .$('[id]')
        .toArray()
        .some((el) => target.$(el).attr('id') === decodeURIComponent(url.hash.slice(1)))
    )
      throw new Error(`Missing fragment: ${href}`);
  }
}
console.log(
  `Validated ${canonicals.size} published routes, HTML links, alternates and first-party assets.`,
);
