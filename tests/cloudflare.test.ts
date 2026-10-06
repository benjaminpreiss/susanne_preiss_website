import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseConfigFileTextToJson } from 'typescript';
import { setCloudflareIndexing } from '../scripts/cloudflare-indexing';

test('native Worker Previews use static assets without account identifiers, DNS routes or runtime code', async () => {
  const parsed = parseConfigFileTextToJson(
    'wrangler.jsonc',
    await readFile('wrangler.jsonc', 'utf8'),
  );
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.config, {
    $schema: './node_modules/wrangler/config-schema.json',
    name: 'susanne-preiss',
    compatibility_date: '2026-10-05',
    workers_dev: false,
    preview_urls: true,
    assets: {
      directory: './dist',
      html_handling: 'force-trailing-slash',
      not_found_handling: '404-page',
      run_worker_first: false,
    },
    previews: {},
  });
  // Dependency auto-merge is not a deployment workflow; keep unexpected workflows gated.
  assert.deepEqual((await readdir('.github/workflows')).sort(), [
    'dependabot-automerge.yml',
    'validate.yml',
  ]);
});

test('Cloudflare rebuilds and checks its own output before the native preview command', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(pkg.devDependencies.wrangler, '4.147.0');
  assert.equal(pkg.scripts['cloudflare:preview'], 'wrangler preview');
  assert.equal(pkg.scripts['cloudflare:build'], 'pnpm build && pnpm artifact:check');
  assert.doesNotMatch(
    pkg.scripts['cloudflare:build'],
    /\|\| true|download-artifact|wrangler|pnpm test|playwright|typecheck|lint/,
  );
});

test('production commands select indexing and audit the final output before deploying', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(
    pkg.scripts['cloudflare:production'],
    'tsx scripts/cloudflare-indexing.ts index && pnpm artifact:check && wrangler deploy',
  );
  assert.equal(
    pkg.scripts['cloudflare:production:noindex'],
    'tsx scripts/cloudflare-indexing.ts noindex && pnpm artifact:check && wrangler deploy',
  );
});

test('production noindex is idempotent and reversible without changing source or robots', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'cloudflare-indexing-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baseline = await readFile('public/_headers', 'utf8');
  const robots = 'User-agent: *\nAllow: /\n';
  await Promise.all([
    writeFile(join(root, 'index.html'), '<h1>Site</h1>'),
    writeFile(join(root, '404.html'), '<h1>Not found</h1>'),
    writeFile(join(root, '_headers'), baseline),
    writeFile(join(root, 'robots.txt'), robots),
  ]);
  await setCloudflareIndexing('noindex', root);
  const noindex = await readFile(join(root, '_headers'), 'utf8');
  assert(noindex.startsWith(baseline.trimEnd()));
  assert.match(noindex, /^\/\*\n  X-Robots-Tag: noindex$/m);
  await setCloudflareIndexing('noindex', root);
  assert.equal(await readFile(join(root, '_headers'), 'utf8'), noindex);
  await setCloudflareIndexing('index', root);
  assert.equal(await readFile(join(root, '_headers'), 'utf8'), baseline);
  assert.equal(await readFile('public/_headers', 'utf8'), baseline);
  assert.equal(await readFile(join(root, 'robots.txt'), 'utf8'), robots);
  assert.equal(await readFile(join(root, 'index.html'), 'utf8'), '<h1>Site</h1>');
  await assert.rejects(setCloudflareIndexing('invalid', root), /Expected indexing mode/);
  await assert.rejects(setCloudflareIndexing(undefined, root), /Expected indexing mode/);
  assert.equal(await readFile(join(root, '_headers'), 'utf8'), baseline);
});

test('indexing selection fails without build output and does not create partial headers', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'cloudflare-indexing-missing-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(setCloudflareIndexing('noindex', root), { code: 'ENOENT' });
  assert.deepEqual(await readdir(root), []);
});

test('tested host files preserve direct permanent redirects, portable aliases and preview noindex', async () => {
  const headers = await readFile('public/_headers', 'utf8');
  assert.equal(await readFile('dist/_headers', 'utf8'), headers);
  assert.match(
    headers,
    /^https:\/\/:worker\.:account\.workers\.dev\/\*\n  X-Robots-Tag: noindex$/m,
  );
  assert.doesNotMatch(headers, /^\/\*|^https:\/\/susanne-preiss\.de/m);
  const rules = (await readFile('dist/_redirects', 'utf8'))
    .trim()
    .split('\n')
    .map((line) => line.split(' '));
  const sources = new Set(rules.map(([from]) => from));
  assert.equal(sources.size, rules.length);
  for (const [from, to, status] of rules) {
    assert(to && to.endsWith('/'));
    assert.equal(status, '301');
    assert.notEqual(from, to);
    assert(!sources.has(to), 'No redirect chains');
    assert(!to.includes('#'), 'Allow browser fragment inheritance');
    await readFile(resolve('dist', '.' + to, 'index.html'));
  }
  assert(rules.some(([from, to]) => from === '/html/about.html' && to === '/ueber-mich/'));
  assert.match(await readFile('dist/html/about.html', 'utf8'), /window.location.hash/);
});
