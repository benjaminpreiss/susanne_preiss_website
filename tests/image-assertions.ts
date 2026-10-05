import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assertLegacyAsset } from './legacy-assertions';

/** Optimized URLs retain the original basename plus Astro's content/transform hash. */
export function assertOptimizedReference(actual: string | undefined, original: string) {
  const name = original
    .split('/')
    .at(-1)!
    .replace(/\.[^.]+$/, '');
  assert.ok(actual?.startsWith(`/_astro/${name}.`), `${actual} should derive from ${original}`);
}
export async function assertOriginalPreserved(original: string) {
  assertLegacyAsset(await readFile(`src/assets/images/${original.split('/').at(-1)}`), original);
}
