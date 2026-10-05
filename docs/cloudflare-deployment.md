# Deploying tested artifacts to Cloudflare

## Current state

`.github/workflows/validate.yml` contains a **disabled-by-default production job**
using standard actions:

1. `validate` builds, tests and uploads the exact static output.
2. `actions/download-artifact` downloads that run's immutable artifact ID.
3. Small checks verify integrity, target configuration and candidate freshness.
4. `cloudflare/wrangler-action` uploads the tested directory with Wrangler **4.147.0**.
5. HTTP and control-plane checks verify the result before recording success.

**Do not enable production yet.** Manual staging and rollback workflows are now
implemented, but owner setup, live staging tests and first activation remain outstanding. No Cloudflare app, token, DNS change or
live deployment has been created by this work. Do not connect Cloudflare Builds;
GitHub Actions is the sole deployment authority, with no second build on Cloudflare.

The downloaded artifact is never rebuilt or modified. Wrangler config lives in
`runner.temp`, outside the artifact. Only the artifact directory is shipped; installed
tooling and repository source remain on the runner. Wrangler is pinned in both the
workflow and `package.json`/`pnpm-lock.yaml`; the action reuses the installed version.
Both third-party action refs are immutable commit SHAs.

## Owner-confirmed inputs

- Repository: `benjaminpreiss/susanne_preiss_website`, public, GitHub Free.
- Cloudflare account ID and account-specific staging origin: configure in GitHub
  Environment variables, not public source or documentation.
- Staging Worker name: `susanne-preiss-staging`.
- Production branch: `master`; canonical origin: `https://susanne-preiss.de`.

These inputs do not prove account ownership or that any project/protection exists.
The production Worker name has not been supplied. Production preflight refuses a
missing Worker, split-traffic deployment, or custom domain attached to another Worker.
The job cannot bootstrap production or change DNS. Domain setup can wait until the
owner has nameserver access; staging can eventually use workers.dev without it.

## GitHub Environment contract

Create/configure these only through the later owner-run setup walkthrough. Do not
paste tokens into chat or commit them. The `production` Environment uses:

| Kind     | Name                        | Value                                                    |
| -------- | --------------------------- | -------------------------------------------------------- |
| Variable | `CLOUDFLARE_DEPLOY_ENABLED` | absent or `false` until separately approved activation   |
| Variable | `CLOUDFLARE_ACCOUNT_ID`     | your intended Cloudflare account ID                      |
| Variable | `CLOUDFLARE_WORKER_NAME`    | confirmed existing production Worker, not a staging name |
| Variable | `CLOUDFLARE_ORIGIN`         | `https://susanne-preiss.de`                              |
| Secret   | `CLOUDFLARE_API_TOKEN`      | account-scoped token entered directly by owner           |

[GitHub's Environment documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
confirms Environment secrets/variables, selected branch restrictions and reviewers
are available for public repositories on Free. Configure a selected **branch** rule
exactly `master`, no tag or PR merge-ref rule. Protect master and review workflow
changes. Once approved and enabled, ordinary successful master pushes should deploy
without mandatory per-deploy reviewers, as requested. Rollback needs separate approval.

Use a custom token with account-scoped **Workers Scripts Edit** (API name:
`Workers Scripts Write`) for this one account. The documented asset-session,
subdomain and domain-read APIs accept it; confirm the full Wrangler operation in
staging before production. Do not add unrelated permissions to resolve a failure
without checking the failing endpoint. Never use a Global API key or grant DNS-write
permissions for ordinary artifact uploads. This scope is account-wide, not per-Worker:
a separate staging token improves revocation/audit, but is not a hard security boundary
between Workers in the same account. The workflow's GitHub token has
only contents-read, actions-read and deployments-write in the production job.

## Safety and verification

- Only this repository's master push events can enter the job; PR/fork/feature and
  Renovate validation runs do not receive its credentials. The enable flag is read
  **inside** the Environment, not in a premature job-level expression.
- Validation cancellation is job-scoped. Production uses `cloudflare-production`
  concurrency with `cancel-in-progress: false`; future rollback must share that key.
- Under that lock, compare current master and previous verified success/active
  Cloudflare identity. Skip stale commits, older successful-commit attempts and
  still-active duplicates. Failed verification is retryable. Concurrency is not FIFO.
  A push arriving after the final freshness read is handled by the next eligible job;
  GitHub ref reads and Cloudflare uploads cannot form an atomic cross-service operation.
- `scripts/deploy-static.ts prepare` verifies artifact API ID/name/run/commit,
  expiry and SHA-256 against the validation job's digest output. The standard download
  action warns rather than fails on checksum mismatches, so the helper checks the
  immutable archive separately and fails closed.
- `scripts/verify-artifact.py` uses Python's standard-library ZIP reader to compare
  **every extracted file** against that verified archive, rejecting unsafe paths,
  mismatches and extra/missing files. It does not extract, upload or access credentials.
  This deliberately avoids a JS ZIP dependency. The static artifact audit runs too.
- `cloudflare/wrangler-action` owns the actual upload. No custom uploader or custom
  extraction pipeline remains. The Wrangler message identifies commit, artifact/run/
  attempt and digest. No runtime Worker code, bindings, SSR adapter or SPA fallback.
- `verify` checks public page bytes/metadata, true 404 content/status, permanent
  redirects and query strings, representative JS/CSS/JPG/PDF bytes, plus the active
  Cloudflare version's annotation and deployment identity. Requests request cache
  revalidation and use cache-busting query parameters; a redirect outside the origin
  is rejected. Real browser fragment behavior and external HLS playback need staging.
- The summary and GitHub Deployment record distinguish uploaded-but-unverified from
  verified success. Upload errors may already have changed the site. Failures never
  trigger an automatic rollback. Check Cloudflare history and the failed run first.

## Static hosting rules

The tested output contains generated `_redirects` (permanent, direct aliases and
canonical slash/index rules), portable alias documents, `404.html`, and `_headers`
with workers.dev-only `noindex`. Production is not noindexed. The temporary hostname
would still be public: noindex is not access control. Canonicals stay at the production
origin so staging uses the exact same bytes.

Workers Free permits 20,000 files and 25 MiB per file; local audits enforce these
and a project 1 GiB total budget. Static asset requests/storage have no additional
charge under the documented static-assets model; external video-provider and GitHub
usage limits are separate. No paid storage, subscription or runtime is introduced.

## Manual staging and rollback

`.github/workflows/staging.yml` is manual-only and must run from master. It accepts
one immutable `artifact_id` and a per-run approval checkbox (false by default).
The `staging` Environment must independently set `CLOUDFLARE_DEPLOY_ENABLED=true`
and contain its own `CLOUDFLARE_API_TOKEN`. It also requires Environment variables
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_ORIGIN` (the full HTTPS workers.dev origin
for `susanne-preiss-staging` on that account). The helper compares the configured
origin with Cloudflare's actual account subdomain before upload. These variables
keep values out of repository files; they are not secrets, and a deployed staging
hostname is publicly reachable. Never put these enable variables or
credentials at repository/organization scope. Missing variables leave jobs disabled.

The read-only selector checks the artifact's source run is a successful, completed
master push of `.github/workflows/validate.yml` in this repository, not a PR/fork or
staging run. Historical successful master artifacts are allowed deliberately; no
moving-latest selection or rebuild. Standard download-artifact receives that exact
source run and ID. The shared helper rechecks the selection before upload.
The staging target uses the Environment-configured account/origin and the fixed,
dedicated `susanne-preiss-staging` name. The workflow can create that Worker only after the
owner enables and manually approves the run. No custom domains may be attached;
no domain/DNS writes are configured. It verifies staging noindex and all normal
post-upload checks. Staging and production have independent non-cancelling locks.

`.github/workflows/rollback.yml` is manual-only, defaults to staging, and requires:

- Target, exact version UUID, matching retained artifact ID, and the currently
  active version UUID the owner approved replacing.
- Per-run approval plus `CLOUDFLARE_ROLLBACK_ENABLED=true` in the selected Environment.
- For production, `CLOUDFLARE_DEPLOY_ENABLED=false` explicitly, before dispatch.

Rollback uses the **same target lock** as ordinary deployment. It checks the active
version has not changed, the selected version remains deployable, and its original
annotation matches the artifact's commit/ID/digest. The standard Wrangler action
runs `rollback <specific-version>`, not a new asset upload or an implicit previous
version. Verification checks the restored version and bytes before recording success.
Production automation stays paused; the workflow never reenables it. Reenable only
with a separate recovery decision, knowing the next eligible master deployment may
replace the rollback. Do not use dashboard rollbacks to bypass serialization.

If the version or artifact expired, this workflow refuses rollback. Recovery requires
an explicit new validated historical build/artifact and separately approved deployment;
that is not guaranteed byte-identical reconstruction, and is not silently done here.
Do not test removed-route behavior or rollback against production.

[Owner setup stages](cloudflare-owner-setup.md) describe the next manual steps.

## Outstanding before activation

- Owner-approved staging project and live tests of redirects/fragments, headers,
  external HLS playback, removed routes, cache replacement and asset rollback.
- Exercise the implemented rollback workflow on staging before enabling production.
  Cloudflare documents versions as including static assets and limits rollback to
  the 100 most recently published versions. The workflow checks deployable versions
  and requires the matching Actions artifact to remain available for byte verification;
  seven-day artifacts are not permanent backups. Never promise indefinite history.
- A setup wizard covering confirmed least-privilege token permissions, production
  Worker/domain onboarding, staging approval, activation and disabling (set the flag
  to `false`; do not cancel an active deployment midway).
- GitHub service-level and Cloudflare live validation; local contract tests are not
  evidence of real hosting semantics. Browser smoke remains blocked by a Chromium
  launch crash in this local environment. Ticket 10 is not resolved.

## Sources and reviewed pins

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/#static-assets),
  [billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/),
  [SSG](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/),
  [headers](https://developers.cloudflare.com/workers/static-assets/headers/),
  [redirects](https://developers.cloudflare.com/workers/static-assets/redirects/).
- [Asset upload session permissions](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/assets/subresources/upload/methods/create/),
  [subdomain read permissions](https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/get/),
  [domain read permissions](https://developers.cloudflare.com/api/resources/workers/subresources/domains/methods/list/).
- [Versions include assets](https://developers.cloudflare.com/workers/versions-and-deployments/),
  [rollback limits](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
- `actions/download-artifact` v4.3.0:
  `d3f86a106a0bac45b974a628896c90dbdf5c8093`; reviewed ID-selection and digest-warning behavior.
- `cloudflare/wrangler-action` v3 distribution:
  `9acf94ace14e7dc412b076f2c5c20b8ce93c79cd`; reviewed inputs and installed-version reuse.
