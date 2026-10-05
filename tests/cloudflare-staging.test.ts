import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  stagingGate,
  stagingCandidate,
  type ArtifactMetadata,
  type ValidationRun,
} from '../scripts/cloudflare-plan';
import { loadStagingCandidate } from '../scripts/staging-artifact';

const commit = 'a'.repeat(40);
const repository = 'benjaminpreiss/susanne_preiss_website';
const metadata: ArtifactMetadata = {
  id: '123',
  name: `static-${commit}-456-1`,
  commit,
  runId: '456',
  digest: 'sha256:' + 'b'.repeat(64),
  expired: false,
};
const run: ValidationRun = {
  id: '456',
  commit,
  repository,
  headRepository: repository,
  branch: 'master',
  event: 'push',
  path: '.github/workflows/validate.yml',
  status: 'completed',
  conclusion: 'success',
};

test('staging requires manual master dispatch, environment opt-in and per-run approval', () => {
  const event = {
    event: 'workflow_dispatch',
    ref: 'refs/heads/master',
    actor: 'owner',
    enabled: 'true',
    approved: 'true',
  };
  assert.equal(stagingGate(event), null);
  for (const enabled of [undefined, '', 'false', '1', 'TRUE'])
    assert.match(stagingGate({ ...event, enabled })!, /disabled/);
  for (const approved of [undefined, '', 'false', '1'])
    assert.match(stagingGate({ ...event, approved })!, /approved/);
  for (const name of ['push', 'pull_request', 'workflow_run'])
    assert.match(stagingGate({ ...event, event: name })!, /manual/);
  assert.match(stagingGate({ ...event, ref: 'refs/heads/feature' })!, /master/);
});

test('manual staging binds a retained artifact to a successful master validation, not latest', () => {
  const candidate = stagingCandidate(metadata, run);
  assert.equal(candidate.commit, commit);
  assert.equal(candidate.id, '123');
  for (const changed of [
    { repository: 'fork/site' },
    { headRepository: 'fork/site' },
    { branch: 'feature' },
    { event: 'pull_request' },
    { event: 'workflow_dispatch' },
    { status: 'in_progress' },
    { conclusion: 'failure' },
    { conclusion: null },
    { path: '.github/workflows/staging.yml' },
    { id: '457' },
    { commit: 'c'.repeat(40) },
  ])
    assert.throws(() => stagingCandidate(metadata, { ...run, ...changed }), /successful master/);
  for (const changed of [
    { expired: true },
    { id: '' },
    { digest: '' },
    { name: 'latest' },
    { name: `static-${commit}-457-1` },
  ])
    assert.throws(() => stagingCandidate({ ...metadata, ...changed }, run));
});

test('staging lookup reads only the explicit artifact and its source run using GitHub credentials', async () => {
  const urls: string[] = [];
  const request: typeof fetch = async (input, init) => {
    const url = String(input);
    urls.push(url);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer fixture-token');
    assert.equal(init?.redirect, 'error');
    if (url.endsWith('/actions/artifacts/123'))
      return Response.json({
        ...metadata,
        id: 123,
        workflow_run: { id: 456, head_sha: commit },
      });
    assert(url.endsWith('/actions/runs/456'));
    return Response.json({
      id: 456,
      head_sha: commit,
      head_branch: run.branch,
      event: run.event,
      path: run.path,
      status: run.status,
      conclusion: run.conclusion,
      repository: { full_name: repository },
      head_repository: { full_name: repository },
    });
  };
  assert.deepEqual(
    await loadStagingCandidate('123', 'fixture-token', request),
    stagingCandidate(metadata, run),
  );
  assert.deepEqual(urls, [
    `https://api.github.com/repos/${repository}/actions/artifacts/123`,
    `https://api.github.com/repos/${repository}/actions/runs/456`,
  ]);
  for (const id of ['', 'latest', '123,124', '../123', '0'])
    await assert.rejects(loadStagingCandidate(id, 'fixture-token', request));
  assert.equal(urls.length, 2, 'Invalid IDs must not trigger network calls');
  await assert.rejects(loadStagingCandidate('123', '', request), /Missing GitHub/);
  await assert.rejects(
    loadStagingCandidate('123', 'fixture-token', async () => new Response('', { status: 404 })),
    /lookup failed \(404\)/,
  );
  await assert.rejects(
    loadStagingCandidate('123', 'fixture-token', async () => Response.json({ id: 124 })),
    /different ID/,
  );
});

test('staging workflow is manual, isolated and uses the selected artifact without rebuilding', async () => {
  const workflow = await readFile('.github/workflows/staging.yml', 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+(?:push|pull_request|workflow_run):/m);
  assert.match(workflow, /default: false/);
  assert.match(workflow, /github.ref == 'refs\/heads\/master' && inputs.approve_staging/);
  assert.match(workflow, /environment: staging/);
  assert.match(workflow, /group: cloudflare-staging\s+cancel-in-progress: false/);
  assert.match(workflow, /ENABLED: \$\{\{ vars.CLOUDFLARE_DEPLOY_ENABLED \}\}/);
  assert.match(workflow, /CLOUDFLARE_WORKER_NAME: susanne-preiss-staging/);
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID: \$\{\{ vars.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.match(workflow, /CLOUDFLARE_ORIGIN: \$\{\{ vars.CLOUDFLARE_ORIGIN \}\}/);
  assert.match(workflow, /accountId: \$\{\{ vars.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_ACCOUNT_ID:\s*['"]?[a-f0-9]{32}/);
  assert.doesNotMatch(workflow, /https:\/\/[^\s]+\.workers\.dev/);
  assert.match(workflow, /artifact-ids: \$\{\{ steps.artifact.outputs.artifact-id \}\}/);
  assert.match(workflow, /run-id: \$\{\{ steps.artifact.outputs.source-run-id \}\}/);
  assert.match(workflow, /uses: cloudflare\/wrangler-action@[a-f0-9]{40}/);
  assert.doesNotMatch(
    workflow,
    /pnpm build|astro build|environment: production|wrangler-production/,
  );
  for (const line of workflow.split('\n').filter((line) => line.includes('uses:')))
    assert.match(line, /@[a-f0-9]{40}(?:\s|$)/);
});

test('disabled/manual-unapproved CLI does not require credentials, and missing credentials fail before upload', () => {
  const cli = ['--import', 'tsx', 'scripts/deploy-static.ts', 'prepare'];
  const base = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    DEPLOY_TARGET: 'staging',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REF: 'refs/heads/master',
    STAGING_APPROVED: 'true',
  };
  assert.match(
    execFileSync(process.execPath, cli, { env: base, encoding: 'utf8' }),
    /Staging deployment is disabled/,
  );
  assert.match(
    execFileSync(process.execPath, cli, {
      env: { ...base, CLOUDFLARE_DEPLOY_ENABLED: 'true', STAGING_APPROVED: 'false' },
      encoding: 'utf8',
    }),
    /not explicitly approved/,
  );
  const missing = spawnSync(process.execPath, cli, {
    env: {
      ...base,
      CLOUDFLARE_DEPLOY_ENABLED: 'true',
      GITHUB_REPOSITORY: repository,
      CLOUDFLARE_ACCOUNT_ID: 'c'.repeat(32),
    },
    encoding: 'utf8',
  });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /Missing GH_TOKEN/);
});
