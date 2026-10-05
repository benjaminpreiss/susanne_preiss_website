import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink, truncate } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { auditArtifact, validateOrigin } from '../scripts/artifact';

test('deployable origin rejects missing, local and placeholder configuration', () => {
  for (const site of [
    undefined,
    '',
    'http://susanne-preiss.de',
    'https://localhost',
    'https://example.com',
    'https://foo.test',
    'https://127.0.0.1',
    'https://host.de/sub/',
    'https://user:pass@host.de',
  ])
    assert.throws(() => validateOrigin(site));
  assert.equal(validateOrigin('https://susanne-preiss.de'), 'https://susanne-preiss.de');
});

test('artifact gate rejects unsafe, unresolved, missing and oversized output', async () => {
  const root = await mkdtemp(resolve('.fixture-artifact-'));
  try {
    await assert.rejects(auditArtifact(root), /Missing index/);
    await writeFile(join(root, 'index.html'), '<html></html>');
    await writeFile(join(root, '404.html'), '<html>Not found</html>');
    assert.equal((await auditArtifact(root)).length, 2);
    for (const [name, body, error] of [
      ['.env', 'SECRET=x', /Unsafe/],
      ['source.ts', 'const x = 1', /Unexpected/],
      ['image.jpg', 'version https://git-lfs.github.com/spec/v1\noid sha256:abc', /LFS/],
    ] as const) {
      await writeFile(join(root, name), body);
      await assert.rejects(auditArtifact(root), error);
      await rm(join(root, name));
    }
    await symlink(join(root, 'index.html'), join(root, 'linked.html'));
    await assert.rejects(auditArtifact(root), /Unsafe/);
    await rm(join(root, 'linked.html'));
    await writeFile(join(root, 'large.mp4'), '');
    await truncate(join(root, 'large.mp4'), 25 * 1024 * 1024 + 1);
    await assert.rejects(auditArtifact(root), /25 MiB/);
    await rm(join(root, 'large.mp4'));
    await writeFile(join(root, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n');
    assert((await auditArtifact(root)).includes('_headers'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
