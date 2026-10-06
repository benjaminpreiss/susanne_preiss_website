import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const workflow = await readFile('.github/workflows/dependabot-automerge.yml', 'utf8');
const config = await readFile('.github/dependabot.yml', 'utf8');
const script = workflow.match(/node <<'POLICY'\n([\s\S]*?)\n\s+POLICY/)?.[1];
assert(script, 'The metadata-only policy must remain inline, without checking out PR code');

function update(overrides = {}) {
  return {
    dependencyName: 'prettier',
    dependencyType: 'direct:development',
    packageEcosystem: 'npm_and_yarn',
    directory: '/',
    targetBranch: 'master',
    dependencyGroup: 'stable-tooling',
    maintainerChanges: false,
    updateType: 'version-update:semver-minor',
    prevVersion: '3.9.0',
    newVersion: '3.10.0',
    ...overrides,
  };
}

function fixture() {
  const sha = 'a'.repeat(40);
  return {
    updates: JSON.stringify([update()]),
    pr: {
      state: 'open',
      draft: false,
      user: { login: 'dependabot[bot]' },
      base: { ref: 'master', repo: { full_name: 'owner/site' } },
      head: { sha, repo: { full_name: 'owner/site' } },
      commits: 1,
      changed_files: 2,
      node_id: 'PR_example',
    },
    commits: [
      {
        sha,
        author: { login: 'dependabot[bot]' },
        commit: { verification: { verified: true } },
      },
    ],
    files: [
      { filename: 'package.json', status: 'modified' },
      { filename: 'pnpm-lock.yaml', status: 'modified' },
    ],
    branch: { protected: true },
  };
}

function execute(data = fixture()) {
  const calls: string[][] = [];
  runInNewContext(script ?? '', {
    process: {
      env: {
        UPDATES: data.updates,
        REPOSITORY: 'owner/site',
        PR_NUMBER: '17',
        HEAD_SHA: 'a'.repeat(40),
      },
    },
    console: { log() {} },
    require(name: string) {
      assert.equal(name, 'node:child_process');
      return {
        execFileSync(command: string, args: string[]) {
          assert.equal(command, 'gh');
          calls.push([...args]);
          const endpoint = args[1];
          if (endpoint === 'repos/owner/site/pulls/17') return JSON.stringify(data.pr);
          if (endpoint === 'repos/owner/site/pulls/17/commits') return JSON.stringify(data.commits);
          if (endpoint === 'repos/owner/site/pulls/17/files?per_page=100')
            return JSON.stringify(data.files);
          if (endpoint === 'repos/owner/site/branches/master') return JSON.stringify(data.branch);
          assert.equal(endpoint, 'graphql');
          return '{}';
        },
      };
    },
  });
  return calls.filter((args) => args[1] === 'graphql');
}

test('Dependabot replaces Renovate with weekly bounded npm and Actions updates', async () => {
  await assert.rejects(readFile('renovate.json'), { code: 'ENOENT' });
  assert.match(config, /^version: 2/m);
  assert.equal((config.match(/package-ecosystem:/g) ?? []).length, 2);
  assert.match(config, /package-ecosystem: npm/);
  assert.match(config, /package-ecosystem: github-actions/);
  assert.equal((config.match(/timezone: Europe\/Berlin/g) ?? []).length, 2);
  assert.equal((config.match(/interval: weekly/g) ?? []).length, 2);
  assert.equal((config.match(/day: monday/g) ?? []).length, 2);
  assert.equal((config.match(/time: '03:00'/g) ?? []).length, 2);
  assert.equal((config.match(/rebase-strategy: disabled/g) ?? []).length, 2);
  assert.match(config, /open-pull-requests-limit: 3/);
  assert.match(config, /open-pull-requests-limit: 2/);
  assert.match(config, /exclude-paths:[\s\S]*\.scratch\/\*\*/);
  assert.match(config, /tests\/fixtures\/\*\*/);
  assert.match(
    config,
    /stable-tooling:\s+applies-to: version-updates\s+dependency-type: development\s+patterns: \['prettier', 'ignore', '@types\/css-tree'\]\s+update-types: \[minor, patch\]/,
  );
  assert.match(config, /astro-svelte-majors:/);
  assert.match(config, /videojs-majors:/);
});

test('privileged workflow is opt-in and metadata-only, never a PR-code execution path', () => {
  assert.match(workflow, /pull_request_target:\s+branches: \[master\]/);
  assert.match(workflow, /types: \[opened, reopened, synchronize, ready_for_review\]/);
  assert.match(workflow, /vars\.DEPENDABOT_AUTOMERGE_ENABLED == 'true'/);
  assert.match(workflow, /pull_request\.user\.login == 'dependabot\[bot\]'/);
  assert.match(workflow, /pull_request\.head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /permissions: \{\}/);
  assert(
    workflow.indexOf('disablePullRequestAutoMerge') <
      workflow.indexOf('uses: dependabot/fetch-metadata'),
  );
  assert.match(workflow, /if \.auto_merge != null then \.node_id else empty end/);
  assert.match(workflow, /contents: write\s+pull-requests: write/);
  assert.doesNotMatch(
    workflow,
    /uses: actions\/checkout|pnpm install|npm install|download-artifact|uses: actions\/cache/,
  );
  assert.doesNotMatch(
    workflow,
    /secrets\.|skip-verification:|skip-commit-verification:|--admin|gh pr review/,
  );
  assert.doesNotMatch(script, /\$\{\{/); // All context/metadata arrives through env, not shell interpolation.
  for (const line of workflow.split('\n').filter((line) => line.includes('uses:')))
    assert.match(line, /@[a-f0-9]{40}(?:\s|$)/);
});

test('eligible single and grouped updates request only head-bound native auto-merge', () => {
  for (const updates of [
    [update()],
    [
      update(),
      update({
        dependencyName: 'ignore',
        prevVersion: '7.0.0',
        newVersion: '7.0.1',
        updateType: 'version-update:semver-patch',
      }),
    ],
    [update({ dependencyName: '@types/css-tree', prevVersion: '3.2.0', newVersion: '3.2.1' })],
  ]) {
    const data = fixture();
    data.updates = JSON.stringify(updates);
    const mutations = execute(data);
    assert.equal(mutations.length, 1);
    assert.match(mutations[0]?.join(' ') ?? '', /enablePullRequestAutoMerge/);
    assert.match(mutations[0]?.join(' ') ?? '', /expectedHeadOid: \$sha/);
    assert.match(mutations[0]?.join(' ') ?? '', /mergeMethod: SQUASH/);
    assert(mutations[0]?.includes(`sha=${'a'.repeat(40)}`));
    assert.doesNotMatch(mutations[0]?.join(' ') ?? '', /\bmergePullRequest\(/);
  }
});

test('every member must be eligible; majors, security/ungrouped, unstable and unknown metadata stay manual', () => {
  for (const overrides of [
    { dependencyName: 'astro' },
    { dependencyName: 'svelte' },
    { dependencyName: '@videojs/html' },
    { dependencyName: 'pnpm' },
    { dependencyName: 'node' },
    { dependencyName: 'wrangler' },
    { dependencyName: 'actions/checkout', packageEcosystem: 'github_actions' },
    { dependencyName: 'prettier-plugin-astro' },
    { dependencyType: 'indirect' },
    { dependencyType: 'direct:production' },
    { directory: '/fixture' },
    { targetBranch: 'other' },
    { dependencyGroup: '' },
    { dependencyGroup: 'security-updates' },
    { maintainerChanges: true },
    { updateType: 'version-update:semver-major', newVersion: '4.0.0' },
    { updateType: 'version-update:semver-patch', newVersion: '4.0.0' },
    { updateType: '' },
    { prevVersion: '0.9.0', newVersion: '0.10.0' },
    { newVersion: '3.10.0-beta.1' },
    { prevVersion: '3.9.0-beta.1' },
    { newVersion: '3.10.0+build' },
    { newVersion: '^3.10.0' },
    { prevVersion: '' },
    { newVersion: '' },
    { newVersion: '3.8.0' },
    { newVersion: '3.9.0' },
  ]) {
    const data = fixture();
    data.updates = JSON.stringify([update(), update(overrides)]);
    assert.equal(execute(data).length, 0, JSON.stringify(overrides));
  }
  for (const updates of ['[]', '{}', 'null', '[null]', '[{}]']) {
    const data = fixture();
    data.updates = updates;
    assert.equal(execute(data).length, 0, updates);
  }
  const malformed = fixture();
  malformed.updates = 'not JSON';
  assert.throws(() => execute(malformed));
});

test('changed heads, forks, human commits, extra files and unprotected branches fail closed', () => {
  const cases: Array<(data: ReturnType<typeof fixture>) => void> = [
    (data) => {
      data.pr.head.sha = 'b'.repeat(40);
    },
    (data) => {
      data.pr.head.repo.full_name = 'fork/site';
    },
    (data) => {
      data.pr.base.repo.full_name = 'other/site';
    },
    (data) => {
      data.pr.base.ref = 'other';
    },
    (data) => {
      data.pr.user.login = 'someone';
    },
    (data) => {
      data.pr.draft = true;
    },
    (data) => {
      data.pr.state = 'closed';
    },
    (data) => {
      data.pr.commits = 2;
    },
    (data) => {
      data.commits[0]!.author.login = 'someone';
    },
    (data) => {
      data.commits[0]!.commit.verification.verified = false;
    },
    (data) => {
      data.commits[0]!.sha = 'b'.repeat(40);
    },
    (data) => {
      data.commits.push(data.commits[0]!);
    },
    (data) => {
      data.files[0]!.filename = '.github/workflows/validate.yml';
    },
    (data) => {
      data.files[0]!.filename = 'pnpm-workspace.yaml';
    },
    (data) => {
      data.files[0]!.status = 'renamed';
    },
    (data) => {
      data.files = [data.files[1]!];
      data.pr.changed_files = 1;
    },
    (data) => {
      data.pr.changed_files = 101;
    },
  ];
  for (const change of cases) {
    const data = fixture();
    change(data);
    assert.equal(execute(data).length, 0, change.toString());
  }
  const unprotected = fixture();
  unprotected.branch.protected = false;
  assert.throws(() => execute(unprotected), /master is not protected/);
});
