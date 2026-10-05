import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { maintainedFiles } from './quality-files.mjs';

/** Do not reprint Markdoc as Markdown: tags, indentation and hard breaks are content. */
export function formatMarkdoc(source: string): string {
  const lf = source.replace(/\r\n?/g, '\n');
  return lf.endsWith('\n') ? lf : `${lf}\n`;
}

async function discover(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (!maintainedFiles([entry.isDirectory() ? `${path}/_` : path]).length) continue;
    if (entry.isDirectory()) files.push(...(await discover(path)));
    else if (entry.isFile() && path.endsWith('.mdoc')) files.push(path);
  }
  return files;
}

async function main(args: string[]) {
  const [mode, ...paths] = args;
  if (mode !== '--check' && mode !== '--write') {
    throw new Error('Usage: tsx scripts/format-markdoc.ts --check|--write [files...]');
  }
  const candidates = paths.length ? paths : await discover('.');
  const files = maintainedFiles(candidates).filter((path) => path.endsWith('.mdoc'));
  let changed = 0;
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const formatted = formatMarkdoc(source);
    if (formatted === source) continue;
    changed++;
    if (mode === '--write') await writeFile(file, formatted);
    else console.error(`${file}: expected LF line endings and a final newline`);
  }
  console.log(
    `Markdoc: ${files.length} files checked; ${changed} ${mode === '--write' ? 'formatted' : 'unformatted'}`,
  );
  if (mode === '--check' && changed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main(process.argv.slice(2));
}
