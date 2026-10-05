import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('validation workflow preserves PR isolation and exact successful artifact handoff', async () => {
  const workflow = await readFile('.github/workflows/validate.yml', 'utf8');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:\s+branches: \[master\]/);
  assert.match(workflow, /permissions:\s+contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(
    workflow,
    /pull_request_target|secrets\.|write-all|continue-on-error|always\(\)|workflow_run/,
  );
  for (const line of workflow.split('\n').filter((line) => line.includes('uses:')))
    assert.match(line, /@[a-f0-9]{40}(?:\s|$)/);
  const commands = [
    'pnpm install --frozen-lockfile',
    'pnpm format:check',
    'pnpm lint',
    'pnpm typecheck',
    'pnpm build',
    'pnpm test',
    'pnpm artifact:check',
    'pnpm smoke:static',
  ];
  let previous = -1;
  for (const command of commands) {
    const position = workflow.indexOf(`run: ${command}`);
    assert(position > previous, `${command} missing or reordered`);
    previous = position;
  }
  assert(workflow.indexOf('uses: actions/upload-artifact@') > previous);
  assert.match(workflow, /if: github.event_name == 'push' && github.ref == 'refs\/heads\/master'/);
  assert.match(workflow, /name=static-\$TESTED_SHA-\$RUN_ID-\$RUN_ATTEMPT/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$TESTED_SHA"/);
  assert.match(workflow, /artifact-id: \$\{\{ steps.upload.outputs.artifact-id \}\}/);
  assert.match(workflow, /retention-days: 7/);
  assert.match(workflow, /include-hidden-files: true/);
  assert.match(workflow, /path: dist\//);
});
