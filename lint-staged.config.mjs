import { maintainedFiles } from './scripts/quality-files.mjs';

/**
 * Return one sequential task list, with explicit staged paths only.
 * @param {string[]} files
 * @returns {string[]}
 */
export default function stagedTasks(files) {
  const maintained = maintainedFiles(files);
  const commands = [];
  /** @param {string[]} paths */
  const args = (paths) => paths.map((path) => JSON.stringify(path)).join(' ');
  const code = maintained.filter((path) => /\.(?:[cm]?[jt]sx?|svelte)$/.test(path));
  const astro = maintained.filter((path) => path.endsWith('.astro'));
  const data = maintained.filter((path) =>
    /\.(?:json[5c]?|css|scss|less|md|markdown|ya?ml|toml|html)$/.test(path),
  );
  const markdoc = maintained.filter((path) => path.endsWith('.mdoc'));
  if (code.length || data.length) {
    commands.push(`oxfmt --write --ignore-path .qualityignore ${args([...code, ...data])}`);
  }
  if (astro.length) commands.push(`prettier --write --ignore-path .qualityignore ${args(astro)}`);
  if (markdoc.length) commands.push(`tsx scripts/format-markdoc.ts --write ${args(markdoc)}`);
  if (code.length || astro.length) {
    commands.push(
      `oxlint --fix --deny-warnings --ignore-path .qualityignore ${args([...code, ...astro])}`,
    );
  }
  return commands;
}
