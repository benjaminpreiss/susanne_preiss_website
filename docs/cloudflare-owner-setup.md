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

| Field                              | Value                                                         |
| ---------------------------------- | ------------------------------------------------------------- |
| Production branch                  | `master`                                                      |
| Root directory                     | `/`                                                           |
| Build command                      | `pnpm install --frozen-lockfile && pnpm run cloudflare:build` |
| Deploy command (noindex initially) | `pnpm run cloudflare:production:noindex`                      |
| Preview command                    | `pnpm run cloudflare:preview`                                 |

**Both production commands now deploy.** The old blocker has been replaced. Use the
noindex command for initial production verification; use `pnpm run cloudflare:production`
only when indexing is approved. If production publication is not approved yet, pause
production builds instead. Change existing dashboard settings before merging this
script change: the old command name will now publish with indexing allowed.

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
built output manually or use production as a test fixture. The production scripts only
select deployment headers, then rerun the artifact audit before publishing.

## 4. Publish without indexing, then launch

After preview verification, branch protection and owner approval:

1. Set the Deploy command to `pnpm run cloudflare:production:noindex` and build `master`.
   This publishes the production Worker, but does not itself attach a live domain.
2. Coordinate the custom-domain/DNS/TLS cutover separately. Preserve email records and
   the old host's website DNS settings for rollback. Verify the live site and confirm
   `X-Robots-Tag: noindex` on its responses. Noindex is not authentication or privacy.
3. When indexing is approved, change the Deploy command to
   `pnpm run cloudflare:production` and trigger another master build. Confirm production
   no longer sends noindex, robots allows crawling, and the sitemap loads. Preview URLs
   must remain noindex. Then submit the sitemap in Search Console if needed.

Subsequent master pushes use the selected mode automatically. No `NODE_ENV`, indexing
secret or old `CLOUDFLARE_DEPLOY_ENABLED` flag is needed. The production scripts apply
headers to the existing build, audit it again and deploy with the pinned Wrangler.
Pausing/disabling builds and native rollback are documented in
[the deployment contract](cloudflare-deployment.md). No per-deploy custom approval system
or custom GitHub deployment framework is introduced.
