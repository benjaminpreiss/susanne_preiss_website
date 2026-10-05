/** Authored paths are deliberately ASCII: lowercase words/digits separated by hyphens.
 * No decoding is performed, so encoded separators/traversal can never become routes.
 */
const authoredPath = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*\/?)?$/;

export function normalizePath(value: string): string {
  if (!authoredPath.test(value)) {
    throw new Error(
      `Invalid authored path: ${JSON.stringify(value)}; expected / or /lowercase-segments/with-hyphens`,
    );
  }
  return value === '/' ? '/' : `${value.replace(/\/$/, '')}/`;
}

/** Relative static output filename, not an HTTP redirect/response policy. */
export function pageOutput(path: string): string {
  return `${normalizePath(path).slice(1)}index.html`;
}

export interface OutputClaim {
  /** Relative file path in the static artifact (including public assets). */
  file: string;
  owner: string;
}

/** Detect both equal files and file/directory conflicts before Astro writes output. */
export function validateOutputClaims(claims: OutputClaim[]): void {
  const files = new Map<string, string>();
  for (const { file, owner } of claims) {
    if (
      !file ||
      file.startsWith('/') ||
      file.includes('\\') ||
      file.split('/').some((part) => !part || part === '.' || part === '..')
    ) {
      throw new Error(`Invalid output filename: ${file} (${owner})`);
    }
    const previous = files.get(file);
    if (previous !== undefined)
      throw new Error(`Duplicate output: ${file} (${previous}; ${owner})`);
    files.set(file, owner);
  }
  for (const [file, owner] of files) {
    const parts = file.split('/');
    for (let length = 1; length < parts.length; length++) {
      const ancestor = parts.slice(0, length).join('/');
      const previous = files.get(ancestor);
      if (previous !== undefined) {
        throw new Error(
          `Output file/directory conflict: ${ancestor} (${previous}) blocks ${file} (${owner})`,
        );
      }
    }
  }
}
