import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Isolated child-process fetch stub: every unrecognized URL throws; no live
// requests or credentials. This exercises the actual verification entry point.
const mock = `
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.env.RUNNER_TEMP;
const failure = process.env.FIXTURE_FAILURE;
const version = '11111111-1111-4111-8111-111111111111';
const deployment = '22222222-2222-4222-8222-222222222222';
const message = process.env.ARTIFACT_NAME + ':' + process.env.ARTIFACT_ID + ':sha256:' + process.env.ARTIFACT_DIGEST;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const headers = new Headers(init.headers);
  if (url.hostname === 'api.cloudflare.com') {
    if (url.pathname.endsWith('/deployments')) return Response.json({ success: true, result: { deployments: [{ id: deployment, versions: [{ version_id: version, percentage: 100 }] }] } });
    if (url.pathname.endsWith('/versions/' + version)) return Response.json({ success: true, result: { annotations: { 'workers/message': failure === 'identity' ? 'wrong' : message } } });
    throw new Error('Unexpected Cloudflare request');
  }
  if (url.hostname === 'api.github.com') {
    if (init.method !== 'POST') throw new Error('Unexpected GitHub method');
    const body = JSON.parse(init.body);
    if (url.pathname.endsWith('/deployments')) {
      if (body.environment !== 'staging' || body.production_environment !== false) throw new Error('Wrong environment');
      return Response.json({ id: 999 });
    }
    if (url.pathname.endsWith('/deployments/999/statuses')) {
      appendFileSync(join(root, 'statuses'), body.state + '\\n');
      return Response.json({ id: 1 });
    }
    throw new Error('Unexpected GitHub request');
  }
  if (url.hostname !== 'susanne-preiss-staging.fixture-owner.workers.dev') throw new Error('Unexpected public host');
  if (headers.has('authorization')) throw new Error('Credential leaked to public host');
  if (!url.searchParams.has('__deployment_check') || headers.get('cache-control') !== 'no-cache') throw new Error('Missing cache-aware request');
  if (url.pathname === '/old') return new Response(null, { status: 301, headers: { location: '/' + url.search } });
  const missing = url.pathname.startsWith('/__deployment_missing_');
  const name = missing ? '404.html' : url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  let body = readFileSync(join(root, 'tested-site', name));
  if (failure === 'bytes' && name === 'index.html') body = Buffer.from('wrong build');
  return new Response(body, { status: missing ? (failure === '404' ? 200 : 404) : 200,
    headers: { 'content-type': name.endsWith('.html') ? 'text/html' : ({ 'main.js': 'text/javascript', 'main.css': 'text/css', 'image.jpg': 'image/jpeg', 'download.pdf': 'application/pdf' }[name] ?? 'application/octet-stream'), ...(failure === 'noindex' ? {} : { 'x-robots-tag': 'noindex' }) } });
};
`;

for (const failure of ['', 'bytes', 'identity', '404', 'noindex']) {
  test(`post-upload verification ${failure ? `fails closed on ${failure}` : 'records success only after all checks'}`, async () => {
    const root = await mkdtemp(resolve('.fixture-cloudflare-verify-'));
    try {
      await mkdir(join(root, 'tested-site'));
      for (const [name, body] of Object.entries({
        'index.html':
          '<html><head><link rel="canonical" href="https://susanne-preiss.de/"></head><body>Tested output</body></html>',
        '404.html': '<html>Not found</html>',
        _headers: 'host-specific fixture',
        _redirects: '/old / 301\n',
        'main.js': 'fixture',
        'main.css': 'fixture',
        'image.jpg': 'fixture',
        'download.pdf': 'fixture',
      }))
        await writeFile(join(root, 'tested-site', name), body);
      const preload = join(root, 'fetch.mjs');
      await writeFile(preload, mock);
      const commit = 'a'.repeat(40);
      const result = spawnSync(
        process.execPath,
        ['--import', preload, '--import', 'tsx', 'scripts/deploy-static.ts', 'verify'],
        {
          encoding: 'utf8',
          timeout: 30_000,
          env: {
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            RUNNER_TEMP: root,
            FIXTURE_FAILURE: failure,
            DEPLOY_TARGET: 'staging',
            STAGING_APPROVED: 'true',
            GITHUB_EVENT_NAME: 'workflow_dispatch',
            GITHUB_REF: 'refs/heads/master',
            GITHUB_REPOSITORY: 'benjaminpreiss/susanne_preiss_website',
            GITHUB_RUN_ID: '789',
            CLOUDFLARE_DEPLOY_ENABLED: 'true',
            CLOUDFLARE_ACCOUNT_ID: 'c'.repeat(32),
            CLOUDFLARE_WORKER_NAME: 'susanne-preiss-staging',
            CLOUDFLARE_ORIGIN: 'https://susanne-preiss-staging.fixture-owner.workers.dev',
            CLOUDFLARE_API_TOKEN: 'fixture-cloudflare-token',
            GH_TOKEN: 'fixture-github-token',
            ARTIFACT_ID: '123',
            ARTIFACT_NAME: 'static-' + commit + '-456-1',
            ARTIFACT_DIGEST: 'b'.repeat(64),
            SOURCE_RUN_ID: '456',
            TESTED_COMMIT: commit,
          },
        },
      );
      assert.equal(result.error, undefined);
      const states = await readFile(join(root, 'statuses'), 'utf8');
      if (failure) {
        assert.notEqual(result.status, 0, result.stdout + result.stderr);
        assert.match(states, /failure\n$/);
        assert.doesNotMatch(states, /success/);
      } else {
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(states, 'pending\nsuccess\n');
      }
      assert.doesNotMatch(
        result.stdout + result.stderr,
        /fixture-cloudflare-token|fixture-github-token/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
