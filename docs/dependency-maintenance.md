# Dependency maintenance (Renovate)

## Policy and activation boundary

Use the **hosted Mend Renovate GitHub App**, not a scheduled Actions runner or a
paid maintenance service. Its official listing confirms free installation/service
for public and private repositories. No app installation, PR creation, merge, push,
repository-setting change or production activation was performed for this setup.

`renovate.json` is ready for onboarding, but its **last package rule disables all
automerging**. Keep that safety latch until the owner approves the categories below
and proves required-check enforcement. Removing that rule is a separate reviewed
change, not an instruction to activate now. If enforcement is unavailable, retain
it and merge manually. Do not use a broad PAT or a custom update workflow.

Proposed defaults, awaiting owner confirmation:

- Routine creation: **Monday 00:00–05:59 Europe/Berlin**, including DST. This is an
  eligibility window, not a guarantee the hosted service runs at a particular time.
- At most two PRs/hour, three open PRs and three branches for routine updates.
- Compatible framework/integrations, player packages, fonts, Node pins, pnpm pins
  and a small stable-tooling group stay together. Major and non-major updates are
  separate; unrelated majors remain separate. Coordinated framework/player majors
  can share their compatibility group, but always require review.
- After activation only stable patch/minor updates to `prettier`, `ignore` and
  `@types/css-tree`, plus lockfile maintenance, are eligible for automerge.
  Everything else defaults to review, including Actions (even SHA-only updates),
  Node/pnpm, Astro/Svelte, Video.js, Wrangler, native packages and other tooling.
  Pre-1.0 changes, prereleases, majors, replacements and rollbacks never qualify.
- Weekly lockfile maintenance refreshes transitive resolutions without deliberately
  bumping direct dependency specifications. It can still change sensitive transitive
  code: inspect the first refresh manually, and remove its eligibility rule if that
  risk is unacceptable. It is not a security audit or a no-risk operation.
- `rebaseWhen: conflicted` and `updateNotScheduled: false` avoid rebuilding every
  queued PR on every master merge. If strict up-to-date branch protection blocks a
  PR, request a rebase in the Dependency Dashboard/PR, then wait for fresh checks.
  Do not relax protection to clear the queue. Manual requests and security updates
  can create work outside the routine window.

## Coverage and toolchain ownership

Only the built-in `npm` and `github-actions` managers are enabled. An allowlist
limits discovery to root `package.json`, `pnpm-workspace.yaml` and workflow YAML;
retired tooling, `.scratch`, fixtures, generated output, agent packages and historical
snapshots are not scanned. `pnpm-lock.yaml` is discovered through the npm manager;
it does not need to be independently included as a manifest. No regex manager is used.

Native extraction was verified for all 31 direct npm dependencies, the Node engine,
`packageManager: pnpm@10.8.0`, workflow `pnpm/action-setup`'s version, workflow
`actions/setup-node`'s Node version, four immutable Action references with version
comments, and the Ubuntu runner. The Node workflow datasource names its package
`actions/node-versions`, so the Node group matches **depName**, not packageName.
Renovate preserves SHA pinning and updates the associated version comment.

Review Node/pnpm updates for support and compatibility rather than tracking every
major automatically. The current CI pins are Node 24.20.0 and pnpm 10.8.0; the
package engine is a compatibility floor, not a deployed-runtime pin. The owner must
also update Cloudflare `NODE_VERSION`/`PNPM_VERSION` build variables and the documented
pins in `docs/cloudflare-deployment.md`. Renovate cannot edit dashboard variables or
infer those documentation changes. Do not merge a toolchain update until coordinated.

## Security alerts and execution trust

Keep GitHub dependency graph and Dependabot alerts enabled where available. Disable
Dependabot **version updates** (no Dependabot configuration exists locally) and check
for inherited/org update bots. Choose Renovate as the sole automatic remediation PR
producer; disable Dependabot security-update PRs if they duplicate Renovate, without
disabling the underlying alerts.

Renovate's GitHub vulnerability remediation depends on accessible Dependabot alerts,
a supported ecosystem/lockfile and a known remediation. Confirm those permissions
and alert availability in the hosted app. OSV scanning is not enabled here. Security
updates bypass the weekly schedule and routine PR/rate/concurrency limits; therefore
those limits are not a hard CI spending cap. Vulnerability PRs are ungrouped and
explicitly **manual merge**, regardless of labels or update size. They must pass the
same required checks; a major security fix is not automatically safe. Review alerts
manually if the app cannot consume them; do not assume all transitives are repairable.

Updating dependencies executes untrusted code. pnpm restricts dependency install
scripts to the existing workspace allowlist (`esbuild`, `sharp`, `@parcel/watcher`),
but build/test tools and repository scripts also execute code. Review any change to
that allowlist, lifecycle scripts, Actions or workflow permissions. Do not enable
Renovate custom post-upgrade commands or expose registry/production credentials.

The existing workflow uses ordinary `pull_request`, `contents: read`, ephemeral
GitHub runners and checkout with `persist-credentials: false`. There is no
secret-bearing `pull_request_target` checkout. App-authored PR commits generate real
PR events and run validation; this does not depend on a workflow's `GITHUB_TOKEN`
creating an event that triggers another workflow.

An eligible, gated merge produces a `master` push, which runs ticket 09 validation
again. **Ticket 10 now uses independent native Cloudflare builds**, not deployment
of the GitHub-tested artifact. GitHub's master artifact is diagnostic only. Cloudflare
does not wait for master validation: merge protection is essential, direct/bypass
pushes must be restricted, and its own build/output audit gates its output. Production
remains disabled. See [deployment policy](cloudflare-deployment.md). Native preview
builds also execute branch code: audit their build credentials/app access and keep
application secrets out of this static project before admitting bot branches.

## Proposed owner setup stages

Confirm this stage order before generating/running a human-only setup wizard. No
secrets are requested or saved. Capture the public repository identity, visibility,
plan, default branch and approval decisions in an owner verification note.

1. **Identity and budget.** Confirm `OWNER/REPO`, `master`, authority to install apps,
   repository visibility and GitHub plan. Approve the Berlin window and eligible
   categories. Check existing bots and Cloudflare preview/build trust as above.
2. **Protection first.** In repository Settings → Branches (branch protection) or
   Rules → Rulesets, protect `master`: require PRs and successful status checks,
   restrict bypass/direct pushes and prevent force pushes/deletion. Require ticket
   09's **Validate static site / validate** (workflow `Validate static site`, job/check
   context `validate`). Select the observed GitHub Actions check in the UI; do not
   invent separate build/lint checks. Confirm required check source and test that a
   failing/missing check blocks merging, including for the app/admin bypass policy.
   If human reviews are required, retain them; eligible PRs still need that review.
3. **Plan support.** GitHub Free supports protected branches for public repositories;
   private protection requires a qualifying plan (Pro for personal repositories,
   Team/Enterprise for organizations). A green run is not enforcement evidence.
   If reliable protection is unavailable, keep manual merging and the safety latch.
4. **Install the app, only on approval.** Open <https://github.com/apps/renovate>,
   select only this repository, inspect requested permissions, and review its
   onboarding/Dependency Dashboard and effective configuration. No PAT is needed.
   Retain useful alerts; verify there is only one PR-producing update bot.
5. **Prove validation before automerge.** Inspect an app-authored PR: expected
   unprivileged validation, no secrets, proper groups, pinned Actions and frozen
   lockfile. Observe failing checks preventing merges and success permitting them.
   Confirm the observed merge commit triggers master validation and identify the
   independent Cloudflare build; do not activate production for this exercise.
6. **Optional automerge approval.** Only after stages 1–5, enable Settings → General
   → Pull Requests → Allow auto-merge if supported. Approve a PR removing the final
   safety-latch rule, retaining all review exclusions. The policy uses PR/platform
   automerge, never direct branch merging or bypass. Observe one eligible merge
   waiting for required checks. Platform automerge can happen outside Monday's
   creation window. If any gating is uncertain, do not perform this stage.

Actual UI availability, installation, permissions, alert ingestion, hosted scheduling,
branch protection and automerge remain owner-verification items, not local test claims.

## Costs, pausing and recovery

The bot is free; running CI is not universally unlimited. Official GitHub allowances:
standard hosted-runner minutes are free on public repositories; private GitHub Free
includes **2,000 minutes/month and 500 MB artifact storage**, with **10 GB cache storage
per repository**. Private Pro/Team include 3,000 minutes with 1 GB/2 GB artifact storage.
Allowances are shared/account-dependent and storage accrues over time. Confirm the
current billing screen rather than treating this document as a price guarantee.
The workflow keeps only master artifacts for seven days; delete unnecessary artifacts
and caches, but deletion does not erase previously accrued usage. Cloudflare has its
own quotas and builds bot branches independently; see the deployment guide.

In account/organization Settings → Billing & licensing, inspect Actions usage and
Budgets and alerts. Set notifications and an available **stop usage** budget; an
alert-only budget is not a spending cap. Check payment/no-payment behavior and
Cloudflare spending controls. No paid upgrade is required or authorized here.

To pause: suspend the app's repository access (Settings → installed GitHub Apps), or
merge `"enabled": false` into Renovate config. **Also disable already queued GitHub
automerge PRs**: pausing Renovate does not cancel GitHub's pending merges. Close unwanted
PRs and cancel queued runs if necessary; pause Cloudflare builds separately. Resume
only after correcting the failure/budget condition.

The owner reviews failed-update logs and release notes, decides whether to rebase,
fix, defer or close a PR, and verifies the site after sensitive upgrades. Never force
a merge just to clear the bot queue. A failing PR does not change master or the deployed
production site (a branch preview may still build). If an accepted update causes a
regression, pause updates/builds, revert through a validated PR and, when production
is active, use the owner-approved Cloudflare rollback procedure. Dependencies, locks
and coordinated runtime settings all need review. This is assisted maintenance, not
zero-intervention maintenance.

## Verification and official references

Re-run the supported validator without adding Renovate as a site dependency:

```sh
NPM_CONFIG_USERCONFIG=/dev/null NPM_CONFIG_CACHE="$PWD/.scratch/ticket17/npm-cache" \
  npm exec --yes --package=renovate@44.138.0 -- renovate-config-validator --strict renovate.json
```

Local platform `--dry-run=extract --print-config` and `--dry-run=lookup --print-config`
were run against isolated copies of the real manifests/workflow. They create no PRs
and perform no installs/lockfile refresh. Tokenless lookup warns that GitHub-sourced
releases need a token; SHA extraction is verified, authenticated SHA lookup is not.
Representative fixture inspection and policy tests are recorded in
`.scratch/ticket17/VERIFICATION.md`. These do not prove hosted merge behavior or that
a future lockfile update passes the site suite.

Official sources consulted during implementation:

- [Hosted app: free public/private service](https://github.com/apps/renovate)
- [Installation and onboarding](https://docs.renovatebot.com/getting-started/installing-onboarding/)
- [npm manager and lockfiles](https://docs.renovatebot.com/modules/manager/npm/)
- [Actions manager, pins and runtime inputs](https://docs.renovatebot.com/modules/manager/github-actions/)
- [Configuration: schedules, rules, rebases, vulnerability alerts](https://docs.renovatebot.com/configuration-options/)
- [Automerge prerequisites and limitations](https://docs.renovatebot.com/key-concepts/automerge/)
- [GitHub protection availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions billing and budgets](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
