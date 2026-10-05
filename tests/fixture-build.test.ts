import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { seedImageCache } from './fixture-build';

test('fixture image caches are independent copies, excluding content stores and output', async () => {
  const root = await mkdtemp(resolve('.fixture-cache-'));
  try {
    const cache = join(root, 'production/node_modules/.astro/assets');
    const fixture = join(root, 'isolated');
    await mkdir(cache, { recursive: true });
    await writeFile(join(cache, 'image.avif'), 'cached image');
    await writeFile(join(cache, '../data-store.json'), 'production content');
    await seedImageCache(fixture, cache);
    const copy = join(fixture, 'node_modules/.astro/assets/image.avif');
    assert.equal(await readFile(copy, 'utf8'), 'cached image');
    await writeFile(copy, 'fixture change');
    assert.equal(await readFile(join(cache, 'image.avif'), 'utf8'), 'cached image');
    await assert.rejects(access(join(fixture, 'node_modules/.astro/data-store.json')));
    await assert.rejects(access(join(fixture, 'dist')));
    await assert.rejects(seedImageCache(fixture, join(root, 'missing')), /run pnpm build/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
