# Connect the repository to Cloudflare

Use **Cloudflare's native Git setup**, not the removed GitHub staging/rollback workflows.
The owner performs these steps. Do not change the existing domain or nameservers yet.

## 1. Prepare the repository

Review and merge the native-build configuration into master after GitHub checks pass.
Then create/push a feature branch from that revision for the first preview. It must
contain `wrangler.jsonc` and the `cloudflare:*` package scripts.

Require **Validate static site / validate** before merging PRs. Keep GitHub validation:
Cloudflare builds do not wait for it, and intentionally do not duplicate its test suite.

If the previous setup was already configured, disable the old Actions deployment
paths first. Remove unused staging/production GitHub secrets/enable variables and
revoke old tokens if no longer used. Do not revoke a token still needed elsewhere.
No GitHub Cloudflare deployment credentials or artifact IDs are needed in the new setup.

## 2. Connect Git in Cloudflare

Open **Workers & Pages → create/connect a Worker to GitHub**, and grant the Cloudflare
GitHub App access to only this repository. Choose Worker name **`susanne-preiss`** to
match `wrangler.jsonc` (or deliberately update both names before building).

Before submitting the form, configure:

| Field             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Production branch | `master`                                                      |
| Root directory    | `/`                                                           |
| Build command     | `pnpm install --frozen-lockfile && pnpm run cloudflare:build` |
| Deploy command    | `pnpm run cloudflare:production`                              |
| Preview command   | `pnpm run cloudflare:preview`                                 |

**Do not accept the default production deploy command.** Our production command is
an intentional blocker and cannot publish the live site. The initial master build
may therefore end with "Production deployment is disabled"; that is expected.

Under build variables (not runtime bindings), configure:

```text
NODE_VERSION=24.20.0
PNPM_VERSION=10.8.0
SKIP_DEPENDENCY_INSTALL=1
HUSKY=0
ASTRO_TELEMETRY_DISABLED=1
WRANGLER_SEND_METRICS=false
```

No account ID, account-specific hostname or credential belongs in repository files.
Cloudflare's connected account supplies the target context. No SSR adapter or starter
Worker is needed. New native previews can be created before first production deployment.

### Token permissions

Workers Builds can create a token or use an existing **user token**. Current native
Builds docs say account-owned tokens are not supported. The automatically generated
token is broader than this static site needs (including KV/R2 and route permissions).
Review scope in **My Profile → API Tokens** before granting access; prefer a user token
restricted to the intended account and the permissions needed for script/static-asset
uploads. Do not add application secrets, paste tokens into chat or commit them. If a
permission fails, inspect the failing endpoint rather than granting unrestricted access.
Review the provider's [current token settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#api-token).

## 3. Enable and review a native preview

In Worker **Settings → Build → Branch control**, enable preview builds. New projects
use Worker Previews with `wrangler preview`; do not switch to legacy `versions upload`.
An older connected project may require the provider's one-time Worker Previews setup.

Push a trusted non-master branch and open a PR. Cloudflare builds the branch and
posts a preview link. Subsequent pushes update the branch URL; each preview deployment
also has its own immutable URL. The native build must pass the site's build/content
validation and generated-output audit. GitHub independently runs the full quality suite.
A preview may be available even when GitHub checks fail; do not merge until checks pass.

Verify the preview's recorded commit, noindex header, canonical metadata, deep links,
permanent redirects/queries/fragments, real missing-path 404, images/PDFs, menu navigation
and external HLS playback. Before production, also test replacement of removed assets/
routes and rollback on a disposable preview with explicit owner approval. Do not modify
built output after validation or use production as a test fixture.

## 4. Leave production disabled until the domain is ready

Do not attach a production custom domain or change DNS yet. Preview URLs need no access
to your domain's nameservers. Keep `pnpm run cloudflare:production` as the Deploy command.
Old `CLOUDFLARE_DEPLOY_ENABLED` flags no longer activate anything.

After preview evidence, branch protections, HTTPS/domain setup and explicit activation
approval, the owner may change the Deploy command to `pnpm exec wrangler deploy` and
coordinate the DNS cutover. Subsequent master pushes then use native automatic deployment.
Pausing/disabling builds and native rollback are documented in
[the deployment contract](cloudflare-deployment.md). No per-deploy custom approval system
or custom GitHub deployment framework remains.
