# Static validation and artifact handoff

`.github/workflows/validate.yml` validates PR event revisions (GitHub's merge
revision) and pushes/merges to `master`. There are no feature-branch push runs,
`pull_request_target`, release/tag triggers, production credentials or deployment.
Configure `Validate static site / validate` as a required check in repository
settings; this change does not provision branch protection.

## Toolchain and local reproduction

CI pins Node **24.20.0**, pnpm **10.8.0**, Ubuntu 24.04 and immutable action commits.
The four action refs resolve to checkout 4.2.2, setup-node 4.4.0, pnpm/action-setup
4.1.0 and upload-artifact 4.6.2. Review upstream changes before updating SHAs.
The package supports Node >=22.12.0; use CI's exact version for reproduction.

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

The formatting/lint/type commands are shared with local tooling; CI never fixes
files. See [coverage and narrow Astro/Markdoc fallbacks](quality-tooling.md).
Tests require a fresh build. Test files run serially to avoid competing image encoders
on small CI runners. Isolated build fixtures copy only `node_modules/.astro/assets`
from that build into their own caches; content stores, generated HTML and source
remain isolated. Astro still validates transformation cache keys and generates any
new image variants. The 120-second per-build timeout remains enforced, with explicit
process-error diagnostics (including for expected-failure content tests).

The build validates editorial schemas, references,
local assets, published routes and links; fixture tests exercise unpublished and
translated content. LFS checkout is enabled even though the current output needs
no LFS pointers. Unresolved pointers in output fail the artifact audit.

The smoke command owns an ephemeral loopback plain file server and Chromium,
checks every output file over HTTP byte-for-byte, real 404 content/status, every
HTML route and redirect, legacy fragment navigation, desktop/mobile menu navigation
and no-JavaScript content. It is not a full visual, external-service, video-playback
or accessibility audit. It requires neither Astro's preview server nor OrbStack.
Browser installation and Linux libraries are provisioned in CI.

## Origin and hosting

`astro.config.mjs` is the non-secret origin configuration: `site` is
`https://susanne-preiss.de`, owner-confirmed in ticket 01. The deployment gate rejects
missing/non-HTTPS/local/placeholder origins, credentials, ports and URL paths.
`output: 'static'`, no adapter and root `base` are required. Subdirectory hosting
is deliberately rejected: it requires explicit configuration, coordinated route
and validator changes, and a rebuild, not moving existing files into a directory.

Serve directory-index HTML, assets with correct MIME types, and `404.html` with
**404** status. Do not use an SPA catch-all. Portable HTML redirects are included;
permanent HTTP redirect rules and Cloudflare-specific behavior are ticket 10's
responsibility. No application Worker, function, SSR adapter or Node server is
needed at runtime. ClientRouter enhances navigation without changing that contract.

The artifact audit allows public file extensions and explicitly `_headers`,
`_redirects`, and supported files under `.well-known/`; all other dotfiles, symlinks,
source extensions and known private/runtime directories fail closed. Add a narrow
reviewed allowance if a host genuinely requires another file. Upload includes
hidden files only **after** this audit; there is no filtering/copy step to lose
media or host configuration. Never copy credentials or authoring material to
`public/`. Generated JavaScript is necessary public code, not an SSR runtime.

Limits: 25 MiB per file and 20,000 files (conservative Cloudflare Pages Free
baseline), plus a project-selected 1 GiB total artifact budget. These are checked,
not silently worked around by omitting large media. Ticket 10 must confirm its
chosen product's current limits; GitHub account storage quota can still reject an
upload. See [Cloudflare limits](https://developers.cloudflare.com/pages/platform/limits/).

## Exact tested artifact

Only successful master push runs upload `dist/`. Artifact name:
`static-<full commit SHA>-<run ID>-<run attempt>`. `git rev-parse HEAD` must equal the
event SHA. Reruns produce different names rather than replacing artifacts. PRs
run all gates but never upload deployable artifacts. A failed or cancelled gate
cannot reach upload (normal success gating, no `always()` or continue-on-error).

Ticket 10 adds a job **in this workflow** with `needs: validate` and a master-push
condition. It consumes these job outputs:

- `needs.validate.outputs.artifact-id`: immutable upload service ID;
- `needs.validate.outputs.artifact-name`: commit/run/attempt association;
- `needs.validate.outputs.tested-commit`: full tested SHA.

Use a reviewed SHA-pinned `actions/download-artifact` with `artifact-ids` set to
that ID in the current run. Never select latest, rebuild, or trigger another
workflow. Use the artifact service digest/integrity verification; investigate any
integrity warning rather than deploying. No separately published checksum asset,
release ZIP, automatic tag or GitHub Release is produced.

Validation currently cancels superseded runs. **Ticket 10 must move cancellation
to validation-job scope when adding deployment**, so cancelling validation cannot
interrupt a deployment halfway through. Ticket 10 owns deployment serialization,
stale-build rejection, environment approval and production credentials. Rerunning
only a future deployment job must consume its original successful validation output,
not infer a name from the new attempt number.

Artifacts expire after **seven days** (and may be deleted earlier). Download a
specific successful run through Actions UI, or:

```sh
gh run download RUN_ID --name static-FULL_SHA-RUN_ID-ATTEMPT --dir downloaded-site
pnpm exec tsx scripts/artifact.ts downloaded-site
pnpm exec tsx scripts/smoke-static.ts downloaded-site
```

Use source/tooling from the tested commit for downloaded-artifact verification.
Do not rebuild over the downloaded directory or filter hidden files. The static
smoke and audit accept the extracted output root, not an archive. Ticket 11 should
use these checks on freshly built output or this specific downloaded artifact;
obsolete historical release ZIPs are not SEO evidence.

Cloudflare deployment history is the proposed routine rollback path, subject to
ticket 10 confirming product support and retention limits. An expired artifact
requires a fresh validated build from Git; byte-identical rebuilding is not promised.

## Cost and verification boundaries

Only PRs and master pushes run, superseded validations cancel, pnpm's download
store is cached by setup-node/lockfile, and artifacts last seven days. No browser
cache or retained PR artifacts are needed. Standard public-repository hosted
Actions usage and private-repository included minutes/storage differ; private CI
is **not** unlimited free usage. Owners must inspect their plan, storage/cache
usage and billing budgets/stop-spending controls before enabling runs. This ticket
does not authorize paid usage or change account limits.

Locally run `actionlint .github/workflows/validate.yml` after workflow edits.
Actual event isolation, cache restore, Linux browser installation, cancellation,
upload retention/digests and rerun output association require GitHub execution;
local syntax/tests do not prove those service behaviors. Ticket 09 evidence and
remaining browser launch limitation are in `.scratch/ticket09/VERIFICATION.md`.
