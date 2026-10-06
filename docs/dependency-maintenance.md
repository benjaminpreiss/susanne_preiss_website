# Dependency maintenance (Dependabot)

## GitHub-native setup

GitHub runs Dependabot from `.github/dependabot.yml`; there is no Mend account,
Renovate runner, personal access token or custom GitHub App. The owner replaced the
original Renovate plan with Dependabot. Remove/suspend any previously installed
Renovate app for this repository and close its pending PRs/queued automerges before
activating Dependabot. Only one update bot should remain active.

Merging this config into the default branch enables scheduled version updates where
repository/org policy permits. It does **not** activate automerging: the separate
metadata-only workflow requires the repository Actions variable
`DEPENDABOT_AUTOMERGE_ENABLED` to equal `true`. Leave it unset until the owner has
proved required-check enforcement. No live settings were changed during implementation.

## Update policy and coverage

- Check weekly on **Monday at 03:00 Europe/Berlin**, including DST. This is a scheduled
  check time, not an exact delivery guarantee or a restriction on merge times.
- npm/pnpm version PR limit: **3**; GitHub Actions version PR limit: **2**. Dependabot
  has no configured Renovate-style hourly/combined branch cap here. Security PRs are
  outside the version-update limit and schedule; these numbers are not spending caps.
- Compatible Astro/Svelte integrations, Video.js packages, fonts and stable tooling
  are grouped. Framework/player majors have separate compatibility groups; unrelated
  majors remain individual. Action patch/minor updates are grouped but always manual.
- Rebasing is **disabled** to avoid rebuilding every queued PR after a master change.
  If a PR conflicts or strict up-to-date protection blocks it, comment
  `@dependabot rebase`, then wait for fresh checks. Do not weaken protection to clear
  the queue. Previously open PRs may continue automatic rebasing for up to 30 days
  after the setting changes, per Dependabot's documented behavior.
- npm ecosystem `/` covers root `package.json` and `pnpm-lock.yaml` (pnpm 10 is
  supported). `versioning-strategy: increase` updates pinned direct versions and their
  lockfile. Scratch, fixtures, retired/generated output and agent packages are excluded.
- The Actions ecosystem covers workflow Action references, including immutable SHA
  pins and version comments. Keep references pinned; inspect version/comment updates.
- **Coverage difference from Renovate:** do not assume Dependabot keeps `engines.node`,
  `packageManager`, `actions/setup-node`'s `node-version` or `pnpm/action-setup`'s
  `version` inputs synchronized. Node/pnpm runtime/tool pins remain an owner-maintained
  task, including Cloudflare `NODE_VERSION`/`PNPM_VERSION` and documented versions in
  [the deployment guide](cloudflare-deployment.md). No custom updater was added.
- Dependabot updates lockfiles with dependency/security PRs; this setup does **not**
  provide Renovate's periodic full lockfile-maintenance refresh. Standalone/transitive
  refreshes remain manual and are not automerge-eligible.

## What can automerge

After owner activation, only the `stable-tooling` **version-update** group is eligible:
`prettier`, `ignore`, and `@types/css-tree`, all direct development dependencies.
Every member must have a known, increasing, stable major >=1 patch/minor version
within the same major. The workflow checks the full metadata array, not substring
matches, the first package alone, PR labels or titles.

Majors, 0.x releases, prereleases, unknown/missing metadata, maintainer-change notices,
production/indirect dependencies, lockfile-only updates, Node/pnpm, Astro/Svelte,
Video.js, Wrangler, native packages and **all workflow/Action updates** remain manual.
Security PRs are not assigned the version-only `stable-tooling` group and remain
manual too. A security label cannot authorize a risky major upgrade.

The workflow checks the current PR identity/head, same-repository master target, a
single verified Dependabot-authored commit, and that only existing `package.json`
and optionally `pnpm-lock.yaml` are modified. Extra commits, forks, changed heads,
renames and unexpected files fail closed. The pinned metadata action currently
verifies the first commit; requiring exactly one commit prevents additional human
commits from inheriting its authorization. Each handled revision first revokes any
previous auto-merge request, before metadata verification, then reauthorizes only if
all checks pass. Incomplete group metadata means manual review, not a fallback to
looser matching.

It then requests GitHub's **native auto-merge**, bound to the inspected head SHA,
using `enablePullRequestAutoMerge`. It never calls a direct merge endpoint, bypasses
protection, approves a PR, or uses `gh pr merge`'s immediate-merge path. Required checks
and any required human reviews still apply. Squash merging must be enabled. If GitHub
refuses to queue an already-mergeable PR or an org policy blocks token writes, inspect
it and merge manually; do not add a direct-merge fallback. This setup does not support
merge queues, which require additional authentication/configuration.

## Trust boundary and event chain

Normal site validation stays on ordinary `pull_request`, with `contents: read`,
checkout credentials not persisted, no production secrets and a frozen pnpm install.
Dependabot creates the PR/commits, so those validation events are not generated by
our workflow's `GITHUB_TOKEN`.

The small automerge workflow uses **`pull_request_target` only for metadata** and
runs the base-branch workflow definition. Its job receives `contents: write` and
`pull-requests: write`, using the ephemeral built-in token. It never checks out code,
installs dependencies, restores caches, downloads artifacts or executes anything
from the PR. Metadata is passed through environment variables; GitHub CLI calls use
argument arrays, not shell interpolation. Do not add PR-code execution to this
privileged workflow. No user-created secret, PAT or external account is needed.

Dependency installation/build/testing still executes untrusted code in the separate
unprivileged validation job. Keep the workspace install-script allowlist narrow
(`esbuild`, `sharp`, `@parcel/watcher`); review lifecycle scripts, native packages and
permission changes. Native Cloudflare preview builds also execute branch code—review
build credentials/app access and keep application secrets out of this static site.

Expected flow: Dependabot PR → unprivileged validation → native gated auto-merge →
master update. Verify the resulting **master push validation** on GitHub before
relying on activation. Events directly caused by `GITHUB_TOKEN` generally suppress
follow-on workflows; this workflow deliberately only enables native auto-merge rather
than directly merging. Local mocks do not establish the hosted event chain. If master
validation does not run, turn off this automation and use manual merges while resolving
it—do not assume a green PR proves a master run or introduce credentials silently.

Ticket 10 uses **independent native Cloudflare builds**, not deployment of the GitHub
artifact. Cloudflare does not wait for master validation; enforce the PR gate and
restrict direct/bypass pushes. GitHub's master artifacts are diagnostic only.
Production remains disabled; this setup does not authorize deployment or DNS changes.

## Owner activation checklist

Before turning on automerge, confirm repository identity, default branch (`master`),
visibility and GitHub plan. Public Free repositories support protected branches;
private repositories need a qualifying plan (Pro for personal repos, Team/Enterprise
for organizations). Auto-merge availability and organization policy must also permit
this setup. If reliable enforcement is unavailable, leave the variable unset and use
manual merges. Passing CI alone is not proof of enforcement.

1. **One bot and alerts:** remove Renovate access/queued automerges if it was installed.
   Enable the dependency graph, Dependabot alerts and Dependabot security updates in
   repository security settings. Keep security updates ungrouped initially; they need
   separate human review. Confirm the new config is on the default branch and inspect
   the Dependabot update logs. GitHub's UI names can vary by account.
2. **Protect master first:** in Settings → Branches or Rules → Rulesets, require PRs
   and ticket 09's **Validate static site / validate** (workflow `Validate static site`,
   actual job/check context `validate`). Select the observed GitHub Actions check/source,
   not this automerge workflow. Restrict direct pushes/bypasses and force pushes/deletion.
   Prefer requiring branches to be up to date; request explicit rebases when needed.
   Retain any required human reviews—this workflow never manufactures approval.
3. **Prove gating:** observe a real Dependabot PR with read-only validation. Verify a
   failed or missing `validate` check prevents merging, including the relevant app/admin
   bypass policy. Inspect package/lockfile diffs and test a rebase. Review the first
   grouped update manually. A `protected` API flag alone cannot prove required checks.
4. **Enable repository features:** Settings → General → Pull Requests: allow squash
   merging and auto-merge. Do not enable a merge queue for this workflow. No setting
   to let Actions approve PRs is required; the workflow never submits reviews.
5. **Opt in:** only after the above, create the non-secret Actions repository variable
   `DEPENDABOT_AUTOMERGE_ENABLED=true` under Settings → Secrets and variables → Actions
   → Variables. No code change or credential is required. A future eligible PR event
   queues auto-merge; for an already-open PR, request `@dependabot rebase` or rerun an
   applicable workflow run. Missing permissions/errors stay manual.
6. **Observe and record:** prove an eligible grouped patch/minor PR waits for checks,
   merges only when requirements pass, and produces master validation. Confirm majors,
   mixed/sensitive groups, security fixes and Actions updates are not queued. Inspect
   the independent Cloudflare build identity without activating production.

These are proposed human-only setup stages; confirm them before generating a guided
setup wizard. Installation/settings, real scheduling, security remediation, native
merge behavior and resulting event delivery have not been exercised locally.

## Cost controls, pausing and recovery

Dependabot is GitHub-native and free for public/private repositories. Normal Dependabot
updates running on GitHub-hosted Actions infrastructure do not count against Actions
minutes, but **PR validation and this automerge workflow are ordinary Actions runs**.
Public standard hosted-runner minutes are free; private GitHub Free includes 2,000
minutes/month, 500 MB artifact storage and 10 GB cache storage per repository. Pro/Team
include 3,000 minutes with 1 GB/2 GB artifact storage. Confirm current account allowances
and billing rather than assuming unlimited private CI. GitHub artifacts expire after
seven days here; Cloudflare has independent build/storage quotas.

In account/org Billing & licensing, inspect usage, configure alerts and any available
**stop-usage** budget. Notification-only budgets do not cap spend. Security updates
and manual rebases can exceed routine PR limits. Deleting artifacts/caches frees
current storage but does not erase accrued charges. No paid upgrade is authorized.

To pause merging: unset/set `DEPENDABOT_AUTOMERGE_ENABLED=false` **and disable auto-merge
on already queued PRs**. Changing a variable or disabling the workflow does not revoke
previous native auto-merge requests. To pause version updates, set each ecosystem's
`open-pull-requests-limit: 0`; this does not stop security updates. Manage security
updates separately in settings without discarding alerts. Close unwanted PRs/cancel
runs as needed and pause Cloudflare builds separately.

The owner still reviews failures, release notes and sensitive upgrades; request fixes
or defer rather than forcing failed checks through. Failed PR validation does not
change master or deployed production (a branch preview may exist). For a regression
after merging, pause automation/builds, revert through a validated PR, and use the
owner-approved Cloudflare rollback procedure if production is active. Include the
lockfile and coordinated runtime settings. This is not zero-intervention maintenance.

## Local evidence and official references

`tests/dependabot.test.ts` executes the actual inline gate with mocked GitHub responses:
eligible groups, majors/mixed groups, 0.x/prereleases, security/unknown metadata, wrong
heads/authors/forks, extra commits/files, lockfile-only changes and missing protection.
These are policy tests, not hosted GitHub integration tests. Config was schema-validated
and both workflows checked with actionlint. See `.scratch/ticket17/dependabot/VERIFICATION.md`.

- [Dependabot options and supported pnpm versions](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference)
- [Automating Dependabot with Actions](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)
- [Pinned fetch-metadata source and output contract](https://github.com/dependabot/fetch-metadata/tree/v3.1.0)
- [Workflow events and pull_request_target security](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Token-generated event restrictions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [GitHub GraphQL schema: head-bound auto-merge input](https://github.com/octokit/graphql-schema/blob/master/schema.graphql)
- [Protected branch availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Dependabot on Actions and billing](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-on-actions)
- [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
