import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import hashes from './fixtures/legacy/assets.json';

const assetHashes = new Map(Object.entries(hashes));

/** Frozen pre-cutover bytes, independent of the current application assets. */
export function assertLegacyAsset(bytes: Uint8Array, original: string) {
  const expected = assetHashes.get(original);
  assert.ok(expected, `Missing legacy asset evidence: ${original}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, original);
}
