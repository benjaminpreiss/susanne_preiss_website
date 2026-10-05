import { readdir, lstat, readFile } from 'node:fs/promises';
import { resolve, join, relative, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import config from '../astro.config.mjs';
import { load } from 'cheerio';

export function validateOrigin(site: unknown): string {
  if (typeof site !== 'string') throw new Error('Missing production origin');
  const url = new URL(site);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !url.hostname.includes('.') ||
    /(^|\.)(localhost|example|invalid|test)(\.|$)/i.test(url.hostname) ||
    /placeholder|your-domain|127\.0\.0\.1|0\.0\.0\.0/i.test(url.hostname)
  )
    throw new Error(`Invalid production origin: ${site}`);
  return url.origin;
}

export async function auditArtifact(root = resolve('dist')) {
  const origin = validateOrigin(config.site);
  if (config.output !== 'static' || config.adapter || (config.base && config.base !== '/'))
    throw new Error('Only explicitly static domain-root builds are supported');
  const files: string[] = [];
  const extensions = new Set([
    '.html',
    '.js',
    '.css',
    '.json',
    '.xml',
    '.txt',
    '.svg',
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.avif',
    '.gif',
    '.pdf',
    '.woff',
    '.woff2',
    '.ttf',
    '.mp4',
    '.webm',
    '.mp3',
    '.ogg',
    '.vtt',
  ]);
  let bytes = 0;
  async function visit(dir: string): Promise<void> {
    for (const name of await readdir(dir)) {
      const file = join(dir, name);
      const path = relative(root, file);
      const info = await lstat(file);
      if (
        info.isSymbolicLink() ||
        [...path].some((character) => character === '\\' || character.charCodeAt(0) < 32) ||
        path.split('/').some((part) => part.startsWith('.') && part !== '.well-known') ||
        /(^|\/)(node_modules|src|content|tests|server|_worker\.js)(\/|$)/.test(path)
      )
        throw new Error(`Unsafe artifact path: ${path}`);
      if (info.isDirectory()) {
        await visit(file);
        continue;
      }
      if (
        !info.isFile() ||
        (!extensions.has(extname(name).toLowerCase()) && !['_headers', '_redirects'].includes(name))
      )
        throw new Error(`Unexpected artifact file: ${path}`);
      if (info.size > 25 * 1024 * 1024) throw new Error(`Cloudflare 25 MiB file limit: ${path}`);
      const body = await readFile(file);
      if (body.subarray(0, 200).toString().startsWith('version https://git-lfs.github.com/spec/v1'))
        throw new Error(`Unresolved LFS pointer: ${path}`);
      if (extname(name) === '.html') {
        const $ = load(body.toString());
        for (const element of $('link[rel="canonical"], link[hreflang]').toArray()) {
          const href = $(element).attr('href');
          if (!href || new URL(href).origin !== origin)
            throw new Error(`Output origin mismatch: ${path}`);
        }
      }
      bytes += info.size;
      files.push(path);
    }
  }
  await visit(root);
  if (!files.includes('index.html') || !files.includes('404.html'))
    throw new Error('Missing index/404');
  if (files.length > 20_000 || bytes > 1024 ** 3)
    throw new Error('Artifact exceeds 20,000 files / project 1 GiB budget');
  console.log(`Static artifact: ${files.length} files, ${bytes} bytes, origin ${origin}`);
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await auditArtifact(resolve(process.argv[2] ?? 'dist'));
