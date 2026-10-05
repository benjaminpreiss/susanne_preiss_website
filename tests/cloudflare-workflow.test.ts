import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { candidateFreshness, WRANGLER_VERSION } from '../scripts/cloudflare-plan';

test('standard artifact and Wrangler actions deploy only opted-in validated master output', async () => {
  const workflow = await readFile('.github/workflows/validate.yml', 'utf8');
  const deploy = workflow.split('  deploy-production:')[1]!;
  assert.match(deploy, /needs: validate/);
  assert.match(deploy, /github\.repository == 'benjaminpreiss\/susanne_preiss_website'/);
  assert.match(deploy, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/master'/);
  assert.match(deploy, /github\.actor != 'renovate\[bot\]'/);
  assert.match(deploy, /environment: production/);
  assert.match(deploy, /group: cloudflare-production\s+cancel-in-progress: false/);
  assert.match(deploy, /ENABLED: \$\{\{ vars.CLOUDFLARE_DEPLOY_ENABLED \}\}/);
  assert.match(deploy, /if \[ "\$ENABLED" = true \]/);
  assert.match(deploy, /actions\/download-artifact@[a-f0-9]{40}/);
  assert.match(deploy, /artifact-ids: \$\{\{ needs.validate.outputs.artifact-id \}\}/);
  assert.doesNotMatch(deploy, /run-id:|repository:|pnpm build|astro build|latest/);
  assert.match(deploy, /cloudflare\/wrangler-action@[a-f0-9]{40}/);
  assert.match(
    deploy,
    new RegExp(`wranglerVersion: '${WRANGLER_VERSION.replaceAll('.', '\\.')}''?`),
  );
  assert.match(deploy, /if: steps.prepare.outputs.deploy == 'true'/);
  assert.match(deploy, /if: steps.upload.outcome == 'success'/);
  assert.match(deploy, /if: failure\(\) && steps.upload.outcome == 'failure'/);
  const positions = [
    'actions/download-artifact@',
    'deploy-static.ts prepare',
    'cloudflare/wrangler-action@',
    'deploy-static.ts verify',
  ].map((command) => deploy.indexOf(command));
  assert(
    positions.every(
      (position, index) => position >= 0 && (index === 0 || position > positions[index - 1]!),
    ),
  );
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(pkg.devDependencies.wrangler, WRANGLER_VERSION);
});

test('older attempts of the same tested commit cannot replace a successful newer artifact', () => {
  const commit = 'a'.repeat(40);
  const candidate = {
    id: '12',
    name: `static-${commit}-50-1`,
    runId: '50',
    commit,
    digest: 'sha256:' + 'b'.repeat(64),
  };
  for (const artifactName of [`static-${commit}-50-2`, `static-${commit}-51-1`]) {
    const success = { commit, artifactId: '13', versionId: 'version-2', artifactName };
    assert.match(candidateFreshness(candidate, commit, success, 'version-2')!, /newer artifact/);
  }
});

test('generated host redirects are permanent, direct and retain portable alias documents', async () => {
  const rules = (await readFile('dist/_redirects', 'utf8'))
    .trim()
    .split('\n')
    .map((line) => line.split(' '));
  const sources = new Set(rules.map(([source]) => source));
  assert.equal(sources.size, rules.length);
  for (const [source, destination, status] of rules) {
    assert.equal(status, '301');
    assert(destination && destination.endsWith('/'));
    assert.notEqual(source, destination);
    assert(!sources.has(destination), 'No redirect chains');
    assert(!destination.includes('#'), 'Allow browser fragment inheritance');
    await readFile(resolve('dist', '.' + destination, 'index.html'));
  }
  assert(
    rules.some(
      ([source, destination]) => source === '/html/about.html' && destination === '/ueber-mich/',
    ),
  );
  assert.match(await readFile('dist/html/about.html', 'utf8'), /window.location.hash/);
});

test('archive verifier detects changed, missing, extra and unsafe files without extracting', async () => {
  const root = await mkdtemp(resolve('.fixture-cloudflare-'));
  try {
    const zip = join(root, 'artifact.zip');
    const directory = join(root, 'site');
    const create = (name = 'index.html') =>
      execFileSync('python3', [
        '-c',
        'import zipfile,sys; z=zipfile.ZipFile(sys.argv[1], "w"); z.writestr(sys.argv[2], "verified"); z.close()',
        zip,
        name,
      ]);
    const verify = () =>
      execFileSync('python3', ['scripts/verify-artifact.py', zip, directory], { stdio: 'pipe' });
    execFileSync('python3', [
      '-c',
      'import pathlib,sys; pathlib.Path(sys.argv[1]).mkdir()',
      directory,
    ]);
    create();
    await writeFile(join(directory, 'index.html'), 'verified');
    verify();
    await writeFile(join(directory, 'index.html'), 'changed');
    assert.throws(verify);
    await rm(join(directory, 'index.html'));
    assert.throws(verify);
    await writeFile(join(directory, 'index.html'), 'verified');
    await writeFile(join(directory, 'extra.html'), 'unexpected');
    assert.throws(verify);
    await rm(join(directory, 'extra.html'));
    for (const name of ['../escape', '/absolute', 'a/../index.html', 'a\\index.html']) {
      create(name);
      assert.throws(verify);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
