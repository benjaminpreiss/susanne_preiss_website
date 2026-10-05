# Owner setup: staging first, production later

Nothing in this document authorizes the agent to provision or deploy. The workflows
must first be reviewed and merged by the owner. A manual workflow cannot be run from
the Actions UI until it exists on the default branch. Production remains disabled.

## Proposed setup-wizard stages (await owner confirmation)

These stages create/configure **only the staging Environment**, not production.
The wizard will be generated after the owner confirms this order and scope.

1. **Confirm account and staging target.** Open Cloudflare Workers & Pages for
   your intended account. Note its account ID and workers.dev subdomain, and confirm
   `susanne-preiss-staging` is a dedicated staging name, not a Worker serving another
   site. Keep account-specific values in GitHub Environment settings, not repository
   files. No Git connection, paid upgrade or DNS change.
2. **Configure GitHub staging Environment.** Open repository Settings → Environments
   for `benjaminpreiss/susanne_preiss_website`; create `staging` if absent. Set selected
   deployment branches to the branch `master`, not a tag rule. Set Environment
   variable `CLOUDFLARE_DEPLOY_ENABLED=false` initially. Add Environment variable
   `CLOUDFLARE_ACCOUNT_ID` with your account ID and `CLOUDFLARE_ORIGIN` with the full
   staging origin: `https://susanne-preiss-staging.<your-subdomain>.workers.dev`
   (replace the placeholder; no trailing slash). These values are shared by staging
   deploy and staging rollback. Public/Free supports these controls. Check there are no same-named repository/organization enable variables.
   Store no production credential here. Captured public target is the staging Environment.
3. **Create and store the staging token.** Open Cloudflare's Account API Tokens page,
   create a custom token with account **Workers Scripts Edit** (API permission
   `Workers Scripts Write`), restricted to the confirmed account. Do not accept the
   broad Workers template's extra KV/R2/DNS permissions without reviewing them.
   Capture the token with hidden input and write it directly to Environment secret
   `CLOUDFLARE_API_TOKEN` in `staging`, never chat, `.env`, scratch notes or command
   arguments. Prefer an expiry and revoke when no longer needed. Account scope is
   not per-Worker isolation; a token with script-write can affect other Workers in
   that account. Token creation/storage does not authorize deployment.
4. **Select an exact tested artifact and approve first staging deployment.** After
   review/merge, let `Validate static site` finish successfully on master. Select its
   immutable artifact ID (not its run ID or name); record the source commit/run and
   digest for audit. The artifact must include the new host files and must not have
   expired. After a separate explicit confirmation, set staging's enable variable
   to `true` and run **Deploy selected artifact to staging** from master with that
   ID and its approval checkbox. This can create/update the public staging Worker.
   No production settings are changed. The wizard should stop before dispatch unless
   the owner explicitly confirms this stage; it must not treat earlier setup as approval.
5. **Review staging evidence and disable when finished.** Inspect the run summary's
   artifact/commit and Cloudflare deployment/version identities, open the reported
   workers.dev site, and perform the browser/live-host checks below. Record the
   non-secret result. Set staging's enable variable back to `false` when finished if
   further manual deployment is not needed. Do not cancel an in-flight upload.

Cloudflare account token page:
https://dash.cloudflare.com/?to=/:account/api-tokens

Repository Environment settings:
https://github.com/benjaminpreiss/susanne_preiss_website/settings/environments

## Live checks still required

The workflow checks page/asset bytes, response status, redirects, staging noindex and
version identity; local mocks only prove checker behavior. On approved staging, also:

- Follow deep links and menu navigation on desktop/mobile, with JavaScript disabled
  where supported. Check portable redirect fragment inheritance (`#about`) and queries.
- Play external HLS videos; unchanged external hosting does not prove staging-origin
  playback or availability. Check MIME types and browser console/network errors.
- Compare successive explicitly selected validated artifacts: changed assets must
  update, and removed managed files/routes must not remain available from stale cache.
  Do not modify an artifact after validation to invent a fixture. If no suitable
  differing artifacts exist, plan a separate owner-approved staging-only fixture test.
- Exercise rollback **on staging first** using two actual known versions and the
  matching retained artifact, and verify restored bytes/404s. Record observed retention
  limits; do not extrapolate from mocks or claim perpetual history.

## Rollback owner inputs

To enable the manual rollback workflow, set `CLOUDFLARE_ROLLBACK_ENABLED=true` in the
selected Environment. Supply target, selected retained version UUID, corresponding
retained artifact ID, expected currently active version UUID, and explicit approval.
Rollback uses the same target lock as deployment. It refuses missing/expired artifacts,
unavailable versions, identity mismatch or a changed active version.

For **production**, first set `CLOUDFLARE_DEPLOY_ENABLED=false` in production. Leave it
false after rollback until separately deciding to resume automatic master deployment.
Otherwise a subsequent master push could replace the recovered version. The workflow
requires the explicit pause and never changes the enable flags for you.

## Production is a later setup

It needs a confirmed production Worker name, an already-provisioned dedicated static
Worker, an active Cloudflare zone, verified custom-domain attachment/TLS and approved
DNS cutover. The ordinary production workflow deliberately refuses bootstrap. Design
and approve that one-off activation after staging evidence is complete; do not rename
the staging Worker or attach the live domain to it as a shortcut.

Create the production Environment with a separate token, master-only branch rule,
confirmed target variables, and enable `false`. Enabling automatic production and any
DNS changes require separate owner approval. No per-deploy reviewer is required after
activation unless the owner requests one. Monitor Cloudflare/GitHub usage and avoid
paid add-ons; public standard hosted Actions and static hosting eligibility do not
make unrelated services or external video-provider usage unlimited.
