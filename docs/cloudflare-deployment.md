# Cloudflare-native builds and branch previews

Cloudflare's GitHub integration is the deployment authority. It builds the connected
branch and uses **native Worker Previews** for non-production branches. No custom
GitHub deploy/staging/rollback jobs, artifact downloader, API client or ZIP verifier
is needed. GitHub retains independent quality checks and short-lived diagnostic artifacts.

## Commands and configuration

`wrangler.jsonc` defines one assets-only Worker (`susanne-preiss`), serving `dist/`
with directory indexes, canonical trailing slashes and real 404s. Its empty `previews`
block enables native previews; assets and compatibility settings stay at the top level.
There is no SSR adapter, request-time application Worker, account ID, secret or DNS route.
Wrangler **4.147.0** is pinned in package.json and the lockfile (native previews need
4.135.0 or later). Match the Worker name when connecting the repository.

Use these Cloudflare build settings:

| Setting                              | Value                                                         |
| ------------------------------------ | ------------------------------------------------------------- |
| Production branch                    | `master`                                                      |
| Root directory                       | `/` (directory containing package.json and wrangler.jsonc)    |
| Build command                        | `pnpm install --frozen-lockfile && pnpm run cloudflare:build` |
| Preview command                      | `pnpm run cloudflare:preview`                                 |
| Deploy command, **until activation** | `pnpm run cloudflare:production`                              |

Build variables: `NODE_VERSION=24.20.0`, `PNPM_VERSION=10.8.0`,
`SKIP_DEPENDENCY_INSTALL=1`, `HUSKY=0`, `ASTRO_TELEMETRY_DISABLED=1`,
`WRANGLER_SEND_METRICS=false`. Set them in Cloudflare's **Build** settings, not runtime
bindings. Skipping automatic installation lets the build command enforce the frozen lockfile.

`cloudflare:build` runs **build + generated-output audit only**. The existing build
validates content schemas, routes/references and static output; the audit checks
asset safety/completeness, canonical origin and size/count limits. It does not rerun
GitHub's formatting, lint, type, unit or browser suites. A failed build/audit blocks
the Cloudflare deployment because commands are chained with `&&`.

`cloudflare:preview` is simply `wrangler preview`. Cloudflare names previews from
branches, updates the branch preview URL on pushes, provides immutable deployment
URLs and posts PR comments. One Worker supports multiple native previews; there is
no separate Worker per PR and no custom PR-comment bot. URLs are public by default.

## Production remains disabled

`cloudflare:production` deliberately **exits with an explanatory error without
invoking Wrangler**. Production-branch builds will therefore show a blocked/failed
deploy, not a false successful publication. `workers_dev: false` additionally disables
the ordinary production workers.dev hostname; native previews have their own URLs.
New previews do not require a first production deployment.

Do not use the form's default `wrangler deploy` command yet. After preview verification,
owner approval, protection checks and a planned custom-domain/TLS/DNS cutover, the owner
may replace the Deploy command with `pnpm exec wrangler deploy`. That change enables
native automatic deployment on subsequent master pushes. No code or setup instructions
here authorize that activation, an account/project creation, DNS changes or a deployment.

## GitHub checks versus Cloudflare builds

GitHub runs format/lint/strict type checks, unit tests, production build, output audit
and browser smoke. Require **Validate static site / validate** before merging to master,
and review repository protections/bypass access. Cloudflare does **not** wait for that
check: a branch preview may exist while GitHub checks are pending or failing. This is
intentional for preview review; do not merge a failing PR. Direct master pushes or
protection bypasses can bypass this merge gate, so restrict them before production.

Cloudflare builds branch commits independently. GitHub PR validation may instead test
GitHub's synthetic merge revision. Neither the preview nor eventual production output
is promised to be byte-identical to a GitHub artifact. The owner explicitly replaced
the former exact-artifact deployment requirement. A merge can change the revision;
inspect the commit/build/deployment identity reported by Cloudflare when verifying it.

Treat branch builds as code execution in the build environment. Native previews isolate
preview settings from production runtime settings, but are **not** equivalent to the
removed trusted-workflow/static-artifact security design. Keep application secrets out
of this static project, restrict who can push branches/change build configuration and
review GitHub App access. Do not enable untrusted fork builds without reviewing the
provider's actual approval/credential behavior. A repository-controlled blocker is an
accident-prevention measure, not protection against a malicious trusted collaborator.

## Static hosting and recovery

The output retains `_redirects` (permanent aliases/slash rules), portable alias HTML,
`404.html` and workers.dev-only `noindex` headers. Production canonicals remain at
`https://susanne-preiss.de`; previews do not rebuild with a different canonical origin.
Native workers.dev previews also document a noindex header. Verify it on the real URL;
noindex is not access control. Add Cloudflare Access if private previews are needed.

Use Cloudflare's native deployment history/rollback controls after explicit owner
approval, not a custom GitHub rollback workflow. Pause automatic builds before recovery,
identify the exact known-good version, restore it and verify pages/assets/statuses
before resuming builds. Versions include assets, but availability is finite; ordinary
rollback is limited to the 100 most recently published versions. If unavailable, an
explicit historical rebuild is a new deployment, not guaranteed byte-identical recovery.
Do not promise custom FIFO ordering, an atomic latest-master gate or coordinated
GitHub/Cloudflare rollback locks: those custom mechanisms have been removed.

## Free-tier limits and remaining evidence

- Static assets: 20,000 files/version and 25 MiB/file on Free. The local audit also
  enforces a project 1 GiB budget; media is never silently discarded. HLS video hosting
  stays with the existing external provider.
- Workers Builds Free: **3,000 build minutes/month, one concurrent build, 20-minute
  build timeout**. GitHub and Cloudflare now both build; budget for both. No paid upgrade
  or storage is required for the inspected output; unrelated services have separate limits.
- Native Previews Free: **100 previews/Worker, 100 deployments/preview**. Cloudflare
  removes the least-recently-deployed preview/oldest deployment when limits are reached.
  Do not assume every closed PR is automatically deleted or history is permanent.

Still unobserved: account provisioning/build settings, native preview creation/updates,
PR comments, actual header/redirect/fragment behavior, browser/video behavior on the
preview origin, removed-route/cache replacement and real rollback. Local tests prove
configuration/contracts, not Cloudflare behavior. Production/DNS activation stays pending.

## Official references

- [Build settings and commands](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
- [Build image and version overrides](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [Build limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
- [GitHub integration and PR comments](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Native previews, URLs and retention](https://developers.cloudflare.com/workers/previews/)
- [Preview configuration](https://developers.cloudflare.com/workers/previews/configuration/)
- [First preview without production](https://developers.cloudflare.com/workers/previews/get-started/)
- [Static asset limits](https://developers.cloudflare.com/workers/platform/limits/#static-assets)
- [Rollback limits](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
