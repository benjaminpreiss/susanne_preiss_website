import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  WRANGLER_VERSION,
  productionGate,
  workersConfig,
  verifyArtifactIdentity,
  verifyArchiveDigest,
  candidateFreshness,
  type ArtifactCandidate,
  type ArtifactMetadata,
} from '../scripts/cloudflare-plan';

const commit = 'a'.repeat(40);
const digest = 'sha256:' + 'b'.repeat(64);
const candidate: ArtifactCandidate = {
  id: '123',
  name: `static-${commit}-456-1`,
  commit,
  runId: '456',
  digest,
};
const metadata: ArtifactMetadata = { ...candidate, expired: false };
const target = {
  accountId: 'c'.repeat(32),
  workerName: 'susanne-preiss-staging',
  origin: 'https://susanne-preiss-staging.owner.workers.dev',
  kind: 'staging' as const,
};

test('build retains host-scoped staging noindex without applying it to production', async () => {
  const headers = await readFile('public/_headers', 'utf8');
  assert.equal(await readFile('dist/_headers', 'utf8'), headers);
  assert.match(
    headers,
    /^https:\/\/:worker\.:account\.workers\.dev\/\*\n  X-Robots-Tag: noindex$/m,
  );
  assert.doesNotMatch(headers, /^\/\*|^https:\/\/susanne-preiss\.de/m);
});

test('production is disabled unless explicitly enabled for a non-Renovate master push', () => {
  const event = { event: 'push', ref: 'refs/heads/master', actor: 'owner', enabled: 'true' };
  assert.equal(productionGate(event), null);
  for (const enabled of [undefined, '', 'false', 'TRUE', '1'])
    assert.match(productionGate({ ...event, enabled })!, /disabled/);
  for (const trigger of [
    'pull_request',
    'pull_request_target',
    'workflow_dispatch',
    'workflow_run',
  ])
    assert.match(productionGate({ ...event, event: trigger })!, /Only master push/);
  assert.match(productionGate({ ...event, ref: 'refs/heads/feature' })!, /Only master push/);
  for (const actor of ['renovate[bot]', 'renovate', 'renovate-bot'])
    assert.match(productionGate({ ...event, actor })!, /Renovate/);
});

test('Workers config serves only the supplied static directory, without DNS changes or runtime', () => {
  assert.equal(WRANGLER_VERSION, '4.147.0');
  assert.deepEqual(workersConfig(target, '/downloaded-site'), {
    name: target.workerName,
    account_id: target.accountId,
    compatibility_date: '2026-10-04',
    workers_dev: true,
    preview_urls: false,
    assets: {
      directory: '/downloaded-site',
      html_handling: 'force-trailing-slash',
      not_found_handling: '404-page',
      run_worker_first: false,
    },
  });
  const production = workersConfig(
    {
      ...target,
      workerName: 'susanne-preiss',
      kind: 'production',
      origin: 'https://susanne-preiss.de',
    },
    '/downloaded-site',
  );
  assert.equal(production.workers_dev, false);
  assert.equal(production.preview_urls, false);
  for (const key of ['main', 'build', 'route', 'routes', 'vars', 'env', 'bindings'])
    assert.equal(Object.hasOwn(production, key), false);
});

test('missing or invalid target configuration fails before any upload', () => {
  for (const accountId of ['', 'placeholder', 'a'.repeat(31), 'a'.repeat(33)])
    assert.throws(() => workersConfig({ ...target, accountId }, '/site'), /account ID/);
  for (const workerName of ['', '-bad', 'bad-', '../site', 'a'.repeat(64)])
    assert.throws(() => workersConfig({ ...target, workerName }, '/site'), /Worker name/);
  assert.throws(() => workersConfig(target, './dist'), /absolute/);
  for (const origin of [
    '',
    'http://susanne-preiss-staging.owner.workers.dev',
    target.origin + '/',
    target.origin + '/path',
    target.origin + '?query',
    target.origin + '#fragment',
    'https://user:password@susanne-preiss-staging.owner.workers.dev',
    target.origin + ':8443',
    'https://susanne-preiss.de',
    'https://another.owner.workers.dev',
    'https://susanne-preiss-staging.owner.workers.dev.evil.invalid',
  ])
    assert.throws(() => workersConfig({ ...target, origin }, '/site'));
  assert.throws(
    () => workersConfig({ ...target, kind: 'production' }, '/site'),
    /Production origin/,
  );
  assert.throws(
    () =>
      workersConfig(
        { ...target, kind: 'production', origin: 'https://susanne-preiss.de' },
        '/site',
      ),
    /Staging name/,
  );
});

test('artifact identity binds immutable ID, digest, commit, name and run, retaining original attempt on retry', () => {
  verifyArtifactIdentity(candidate, metadata);
  const rerun = { ...candidate, name: `static-${commit}-456-2` };
  verifyArtifactIdentity(rerun, { ...rerun, expired: false });
  for (const changed of [
    { expired: true },
    { id: '124' },
    { runId: '457' },
    { commit: 'c'.repeat(40) },
    { name: 'latest' },
    { digest: 'sha256:' + 'c'.repeat(64) },
  ])
    assert.throws(() => verifyArtifactIdentity(candidate, { ...metadata, ...changed }), /metadata/);
  for (const changed of [
    { id: '' },
    { id: '-1' },
    { runId: 'NaN' },
    { commit: 'master' },
    { digest: '' },
    { name: 'latest' },
    { name: `static-${commit}-457-1` },
    { name: `static-${commit}-456-0` },
  ])
    assert.throws(() => verifyArtifactIdentity({ ...candidate, ...changed }, metadata));
});

test('archive integrity mismatches and missing digests fail closed', () => {
  verifyArchiveDigest(digest, 'b'.repeat(64));
  for (const actual of ['', 'c'.repeat(64), 'b'.repeat(63), digest])
    assert.throws(() => verifyArchiveDigest(digest, actual), /integrity/);
  assert.throws(() => verifyArchiveDigest('', ''), /integrity/);
});

test('freshness skips stale and already-verified artifacts but permits recovery retries', () => {
  const success = { commit, artifactId: candidate.id, versionId: 'version-1' };
  assert.equal(candidateFreshness(candidate, commit, null, null), null);
  assert.match(candidateFreshness(candidate, 'c'.repeat(40), null, null)!, /stale/);
  assert.match(candidateFreshness(candidate, commit, success, 'version-1')!, /duplicate/);
  assert.equal(candidateFreshness(candidate, commit, success, 'rolled-back-version'), null);
  assert.equal(candidateFreshness(candidate, commit, null, 'unverified-upload'), null);
  assert.equal(
    candidateFreshness(candidate, commit, { ...success, artifactId: '99' }, 'version-1'),
    null,
  );
  assert.throws(() => candidateFreshness(candidate, '', null, null), /current master/);
});
