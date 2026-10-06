import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseConfigFileTextToJson } from 'typescript';

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

test('the initial production command fails closed even if obsolete enable flags are set', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.doesNotMatch(pkg.scripts['cloudflare:production'], /wrangler/);
  const result = spawnSync('/bin/sh', ['-c', pkg.scripts['cloudflare:production']], {
    env: { PATH: process.env.PATH, CLOUDFLARE_DEPLOY_ENABLED: 'true' },
    encoding: 'utf8',
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Production deployment is disabled/);
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
