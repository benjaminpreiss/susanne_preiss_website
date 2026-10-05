# Static validation and diagnostic artifacts

`.github/workflows/validate.yml` checks PR event revisions (GitHub's merge revision)
and pushes to master. There are no feature-branch push runs, release/tag triggers,
`pull_request_target`, deployment jobs or Cloudflare credentials in GitHub Actions.
Superseded validation is cancelled at job scope. Configure **Validate static site /
validate** as a required merge check; committing the workflow does not configure
repository protections or prevent privileged bypasses.

## Local and CI checks

CI pins Node **24.20.0**, pnpm **10.8.0**, Ubuntu 24.04 and immutable action commits:
checkout 4.2.2, setup-node 4.4.0, pnpm/action-setup 4.1.0, upload-artifact 4.6.2.
The package supports Node >=22.12.0; use CI's version for reproduction.

```sh
HUSKY=0 pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm exec playwright install --with-deps chromium
pnpm artifact:check
pnpm smoke:static
```

Formatting/lint/type checks reuse the local Husky scripts without formatting fixes.
See [tool coverage and narrow fallbacks](quality-tooling.md). Tests require a fresh
build and run serially; build fixtures use independent copies of Astro's image cache,
not shared content stores or generated HTML. CI checks out LFS assets and the output
audit rejects unresolved LFS pointers. No CI browser/server depends on the owner's
machine or OrbStack.

The build validates content/schema references, routes and internal assets. The output
audit requires explicitly static domain-root hosting, a verified production HTTPS
origin, no SSR adapter, safe public files, complete index/404 output, and matching
canonical/alternate origins. It allows required `_headers`, `_redirects` and narrowly
supported `.well-known` files, but rejects symlinks, source, private/runtime directories
and other dotfiles. Never copy credentials or authoring content to public output.

Limits: Workers Static Assets Free allows **20,000 files/version and 25 MiB/file**;
the project also caps total output at 1 GiB. The audit fails rather than dropping
media. These are output limits, not promises about GitHub/Cloudflare build allowances.

The smoke script owns a plain static HTTP server and browser. It checks every file's
bytes, routes/deep links, portable redirects/fragments, 404 content/status, desktop/
mobile menu navigation and no-JavaScript content. It does not emulate Cloudflare's
HTTP redirect/header/cache rules or prove external streaming video playback. Those
require an approved live preview. An Astro preview-server pass is not a replacement.

## GitHub artifacts are evidence, not deployment input

Successful master push runs upload the exact tested `dist/`, including required hidden
host files, for seven days. Name: `static-<full commit SHA>-<run ID>-<run attempt>`.
The checkout SHA must match the event SHA; reruns have distinct attempt names. PR
runs get no deployment credentials and do not upload these master artifacts.
A failed/cancelled validation cannot reach artifact upload.

Artifacts remain useful for reproduction and SEO audits:

```sh
gh run download RUN_ID --name static-FULL_SHA-RUN_ID-ATTEMPT --dir downloaded-site
pnpm exec tsx scripts/artifact.ts downloaded-site
pnpm exec tsx scripts/smoke-static.ts downloaded-site
```

Use tooling from the tested commit. Do not rebuild over a downloaded directory or
filter away host files. Artifacts may expire or be deleted earlier; a historical Git
build is not guaranteed byte-identical reconstruction. No automatic tags, GitHub
Releases, custom ZIP packaging or published checksum assets are used.

## Cloudflare now builds independently

The owner replaced the ticket 10 exact-GitHub-artifact handoff with **Cloudflare-native
Git builds and Worker Previews**. Cloudflare installs the frozen lockfile and runs
`pnpm run cloudflare:build` (site build + output audit), then its native preview command.
It does not rerun GitHub's lint/type/unit/browser suite or wait for GitHub checks.
A preview may be published before or despite a failing GitHub check. Required merge
checks are therefore essential before later enabling production from master.

Cloudflare's branch commit and output may differ from GitHub's PR merge revision and
artifact. Do not claim identity between them. Inspect the provider's own build/commit/
deployment identity and live site when accepting a preview or launch.
[Deployment contract](cloudflare-deployment.md) and [owner setup](cloudflare-owner-setup.md)
contain the exact commands, intentional production blocker, provider limits and recovery.

## Ticket 11 handoff and evidence limits

SEO work uses freshly generated output, not an obsolete release ZIP. Verify canonical
origin `https://susanne-preiss.de`, metadata, sitemap/robots, assets, directory indexes,
portable alias documents and the generated host rules. After an approved native preview,
record its exact commit/build/deployment identity and verify actual HTTP redirects,
queries/fragments, genuine 404s, noindex and media/browser behavior. After production
activation, repeat the host checks and ensure production is not noindexed. Native
preview evidence is not evidence of a future custom-domain/TLS/DNS cutover.

Run `actionlint .github/workflows/validate.yml` after workflow changes. Local syntax/
contract tests cannot prove real GitHub cancellation, artifact retention/integrity or
Cloudflare build/preview/rollback behavior. Public standard hosted Actions and private
CI have different allowances; inspect billing/storage limits and avoid paid add-ons.
Workers Builds has a separate free build-minute budget. No account provisioning,
settings changes, pushes or deployments are authorized by these docs.
