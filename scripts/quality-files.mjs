import { readFileSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';
import ignore from 'ignore';

/**
 * Shared exclusions for custom tools; native CLIs read the same ignore file.
 * @param {string[]} files
 * @param {string} [root]
 */
export function maintainedFiles(files, root = process.cwd()) {
  const exclusions = ignore().add(readFileSync(`${root}/.qualityignore`, 'utf8'));
  return files.filter((file) => {
    const path = relative(root, file).split('\\').join('/');
    return path !== '' && !isAbsolute(path) && !path.startsWith('../') && !exclusions.ignores(path);
  });
}
