import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import config from '../renovate.json';

test('Renovate uses native managers and limits discovery to maintained manifests', () => {
  assert.deepEqual(config.enabledManagers, ['npm', 'github-actions']);
  assert.deepEqual(config.includePaths, [
    'package.json',
    'pnpm-workspace.yaml',
    '.github/workflows/*.yml',
  ]);
  assert(config.extends.includes('helpers:pinGitHubActionDigests'));
  assert(config.ignorePaths.includes('.scratch/**'));
  assert(config.ignorePaths.includes('dist/**'));
});

test('routine maintenance is weekly and bounded, without continuous rebases', () => {
  assert.equal(config.timezone, 'Europe/Berlin');
  assert.deepEqual(config.schedule, ['* 0-5 * * 1']);
  assert.equal(config.lockFileMaintenance.enabled, true);
  assert.deepEqual(config.lockFileMaintenance.schedule, config.schedule);
  assert.equal(config.updateNotScheduled, false);
  assert.equal(config.rebaseWhen, 'conflicted');
  assert.equal(config.prHourlyLimit, 2);
  assert.equal(config.prConcurrentLimit, 3);
  assert.equal(config.branchConcurrentLimit, 3);
});

test('automerge remains latched off, with only narrow future eligibility', () => {
  assert.equal(config.automerge, false);
  assert.equal(config.automergeType, 'pr');
  assert.equal(config.platformAutomerge, true);
  const eligible = config.packageRules.filter((rule) => rule.automerge === true);
  assert.equal(eligible.length, 2);
  assert.deepEqual(eligible[0]?.matchPackageNames, ['prettier', 'ignore', '@types/css-tree']);
  assert.deepEqual(eligible[0]?.matchManagers, ['npm']);
  assert.equal(eligible[0]?.matchCurrentVersion, '>=1.0.0');
  assert.deepEqual(eligible[0]?.matchUpdateTypes, ['minor', 'patch']);
  assert.deepEqual(eligible[1]?.matchUpdateTypes, ['lockFileMaintenance']);
  const latch = config.packageRules.at(-1);
  assert.match(latch?.description ?? '', /^ACTIVATION SAFETY LATCH:/);
  assert.equal(latch?.automerge, false);
  assert.deepEqual(latch?.matchUpdateTypes, [
    'major',
    'minor',
    'patch',
    'pin',
    'digest',
    'pinDigest',
    'lockFileMaintenance',
    'replacement',
    'rollback',
  ]);
  for (const rule of config.packageRules.filter(
    (rule) => rule.matchCurrentVersion === '<1.0.0' || rule.matchNewValue === '/-/',
  )) {
    assert.equal(rule.automerge, false);
  }
});

test('security remediation is immediate but manual; validation remains unprivileged', async () => {
  assert.equal(config.vulnerabilityAlerts.enabled, true);
  assert.equal(config.vulnerabilityAlerts.automerge, false);
  assert.equal(config.vulnerabilityAlerts.groupName, null);
  assert.deepEqual(config.vulnerabilityAlerts.schedule, ['at any time']);
  const workflow = await readFile('.github/workflows/validate.yml', 'utf8');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /permissions:\s+contents: read/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.|write-all/);
});
