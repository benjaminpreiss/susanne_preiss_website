import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { rollbackGate, verifyRollbackSelection } from '../scripts/cloudflare-plan';

const selected = '11111111-1111-4111-8111-111111111111';
const current = '22222222-2222-4222-8222-222222222222';

test('rollback is manual, explicitly enabled/approved, and requires production automation paused', () => {
  const request = {
    event: 'workflow_dispatch',
    ref: 'refs/heads/master',
    actor: 'owner',
    kind: 'production' as const,
    enabled: 'false',
    approved: 'true',
    rollbackEnabled: 'true',
  };
  assert.equal(rollbackGate(request), null);
  for (const enabled of [undefined, '', 'true', 'FALSE'])
    assert.match(rollbackGate({ ...request, enabled })!, /false before rollback/);
  for (const rollbackEnabled of [undefined, '', 'false'])
    assert.match(rollbackGate({ ...request, rollbackEnabled })!, /explicitly/);
  assert.match(rollbackGate({ ...request, approved: 'false' })!, /explicitly/);
  assert.match(rollbackGate({ ...request, event: 'push' })!, /manual/);
  assert.match(rollbackGate({ ...request, ref: 'refs/heads/feature' })!, /master/);
  assert.equal(rollbackGate({ ...request, kind: 'staging', enabled: 'true' }), null);
});

test('rollback binds explicit retained version, approved active state and artifact identity', () => {
  verifyRollbackSelection(
    selected,
    current,
    current,
    [selected],
    'artifact-identity',
    'artifact-identity',
  );
  for (const version of ['', 'previous', 'latest', '$(command)', '1'.repeat(36)])
    assert.throws(
      () => verifyRollbackSelection(version, current, current, [selected], 'a', 'a'),
      /UUID/,
    );
  assert.throws(() => verifyRollbackSelection(selected, '', current, [selected], 'a', 'a'), /UUID/);
  assert.throws(
    () => verifyRollbackSelection(selected, current, selected, [selected], 'a', 'a'),
    /changed/,
  );
  assert.throws(
    () => verifyRollbackSelection(selected, current, current, [], 'a', 'a'),
    /retained/,
  );
  assert.throws(
    () => verifyRollbackSelection(selected, current, current, [selected], undefined, 'a'),
    /artifact/,
  );
  assert.throws(
    () => verifyRollbackSelection(selected, current, current, [selected], 'other', 'a'),
    /artifact/,
  );
});

test('rollback uses the standard action, an explicit version and the same target lock as deployment', async () => {
  const workflow = await readFile('.github/workflows/rollback.yml', 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /options: \[staging, production\]/);
  assert.match(workflow, /default: false/);
  assert.match(workflow, /environment: \$\{\{ inputs.target \}\}/);
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID: \$\{\{ vars.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.match(workflow, /CLOUDFLARE_ORIGIN: \$\{\{ vars.CLOUDFLARE_ORIGIN \}\}/);
  assert.match(workflow, /accountId: \$\{\{ vars.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_ACCOUNT_ID:\s*['"]?[a-f0-9]{32}/);
  assert.doesNotMatch(workflow, /https:\/\/[^\s]+\.workers\.dev/);
  assert.match(workflow, /group: cloudflare-\$\{\{ inputs.target \}\}\s+cancel-in-progress: false/);
  assert.match(workflow, /\[ "\$DEPLOY_ENABLED" != false \]/);
  assert.match(workflow, /\[ "\$ROLLBACK_ENABLED" != true \]/);
  assert.match(workflow, /uses: cloudflare\/wrangler-action@[a-f0-9]{40}/);
  assert.match(workflow, /rollback "\$\{\{ steps.prepare.outputs.rollback-version \}\}"/);
  assert.match(workflow, /if: steps.upload.outcome == 'success'/);
  assert.doesNotMatch(workflow, /pnpm build|astro build|--assets|continue-on-error/);
  for (const line of workflow.split('\n').filter((line) => line.includes('uses:')))
    assert.match(line, /@[a-f0-9]{40}(?:\s|$)/);
});
