/**
 * @file Checks surrounding the standard Cloudflare Wrangler action, not an uploader.
 *
 * Each workflow invokes this CLI in a separate step:
 * - `prepare`: audit the downloaded artifact, check its ZIP digest and extracted
 *   bytes, validate the live target and freshness/rollback choice, then write a
 *   Wrangler config outside the asset directory and emit `deploy=true`.
 * - The workflow's Wrangler action performs the actual deploy or rollback.
 * - `verify`: check the live version and HTTP output, then record verified success.
 * - `upload-failed`: record an action failure without claiming a version is active.
 *
 * DEPLOY_TARGET selects production/staging; DEPLOY_OPERATION selects deploy/rollback.
 * Enable/approval flags are checked before credentials are required. Target settings
 * come from GitHub Environment variables; GH_TOKEN and CLOUDFLARE_API_TOKEN are used
 * only for their respective APIs. ARTIFACT_* identifies output already built/tested
 * elsewhere; ARTIFACT_DIGEST arrives as bare hex and is normalized below.
 *
 * The workflow must hold the shared target concurrency lock across prepare, the
 * Wrangler action and verify. This script does not acquire a lock, rebuild output,
 * upload assets, change DNS or perform automatic recovery on failure.
 *
 * @example
 * // Within a configured Actions job, before the Wrangler action:
 * // pnpm exec tsx scripts/deploy-static.ts prepare
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { load } from 'cheerio';
import { auditArtifact } from './artifact';
import {
  productionGate,
  stagingGate,
  rollbackGate,
  verifyRollbackSelection,
  workersConfig,
  WRANGLER_VERSION,
  candidateFreshness,
  verifyArtifactIdentity,
  verifyArchiveDigest,
  type ArtifactCandidate,
  type SuccessfulDeployment,
} from './cloudflare-plan';

import { loadStagingCandidate } from './staging-artifact';

/** A deployment is a traffic assignment; its version identifies the uploaded assets/config. */
type ActiveDeployment = { deploymentId: string; versionId: string };

const env = process.env;
const kind = env.DEPLOY_TARGET ?? 'production';
assert(kind === 'production' || kind === 'staging', 'Unknown deployment target');
const operation = env.DEPLOY_OPERATION ?? 'deploy';
assert(operation === 'deploy' || operation === 'rollback', 'Unknown deployment operation');
const event = {
  event: env.GITHUB_EVENT_NAME ?? '',
  ref: env.GITHUB_REF ?? '',
  actor: env.GITHUB_ACTOR ?? '',
  enabled: env.CLOUDFLARE_DEPLOY_ENABLED,
};
const skip =
  operation === 'rollback'
    ? rollbackGate({
        ...event,
        kind,
        approved: env.ROLLBACK_APPROVED,
        rollbackEnabled: env.CLOUDFLARE_ROLLBACK_ENABLED,
      })
    : kind === 'production'
      ? productionGate(event)
      : stagingGate({ ...event, approved: env.STAGING_APPROVED });
if (skip) {
  console.log(skip);
} else {
  await main(kind, operation);
}

/**
 * Run the phase named by argv[2] after the appropriate eligibility gate passes.
 * Reads credentials/config from the process environment and artifact files from
 * RUNNER_TEMP/tested-site. Writes only temporary preparation files, Actions outputs,
 * the run summary and GitHub Deployment records; Cloudflare API calls are read-only.
 *
 * @param kind Target Environment; staging allows first deployment without a custom domain.
 * @param operation Forward deploy or restoration of an explicitly selected retained version.
 * @throws On invalid configuration, API failures or verification mismatches. A failed
 * post-upload check does not undo the live change: the owner must decide recovery.
 */
async function main(kind: 'production' | 'staging', operation: 'deploy' | 'rollback') {
  /** Read a required setting, reporting only its name (never its potentially secret value). */
  const required = (name: string) => {
    const value = env[name];
    if (!value?.trim()) throw new Error(`Missing ${name}`);
    return value;
  };
  assert.equal(required('GITHUB_REPOSITORY'), 'benjaminpreiss/susanne_preiss_website');
  const githubToken = required('GH_TOKEN');
  const cloudflareToken = required('CLOUDFLARE_API_TOKEN');
  const candidate: ArtifactCandidate = {
    id: required('ARTIFACT_ID'),
    name: required('ARTIFACT_NAME'),
    commit: required('TESTED_COMMIT'),
    runId: required(
      kind === 'production' && operation === 'deploy' ? 'GITHUB_RUN_ID' : 'SOURCE_RUN_ID',
    ),
    digest: `sha256:${required('ARTIFACT_DIGEST')}`,
  };
  if (kind === 'production' && operation === 'deploy')
    assert.equal(
      candidate.commit,
      required('GITHUB_SHA'),
      'Candidate does not match the workflow revision',
    );
  if (kind === 'staging') {
    assert.equal(required('CLOUDFLARE_WORKER_NAME'), 'susanne-preiss-staging');
  }
  const mode = process.argv[2];
  assert(
    mode === 'prepare' || mode === 'verify' || mode === 'upload-failed',
    'Unknown deployment check',
  );
  const root = required('RUNNER_TEMP');
  const directory = join(root, 'tested-site');
  const archive = join(root, 'artifact.zip');
  const config = workersConfig(
    {
      accountId: required('CLOUDFLARE_ACCOUNT_ID'),
      workerName: required('CLOUDFLARE_WORKER_NAME'),
      origin: required('CLOUDFLARE_ORIGIN'),
      kind,
    },
    directory,
  );
  const origin = required('CLOUDFLARE_ORIGIN');
  const repository = required('GITHUB_REPOSITORY');
  const githubBase = `https://api.github.com/repos/${repository}`;
  const cfBase = `https://api.cloudflare.com/client/v4/accounts/${config.account_id}/workers`;
  const worker = `${cfBase}/scripts/${config.name}`;
  const message = `${candidate.name}:${candidate.id}:${candidate.digest}`;
  const runUrl = `https://github.com/${repository}/actions/runs/${required('GITHUB_RUN_ID')}`;
  let deploymentRecord: number | undefined;
  let files: string[] = [];

  /**
   * Send an authenticated API request with a timeout and no redirect following.
   * Call only with the fixed GitHub/Cloudflare API URLs constructed above, never
   * public-site or signed-download URLs. Errors omit provider bodies and credentials.
   */
  async function request(url: string, token: string, init: RequestInit = {}) {
    const response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(60_000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error(`Control-plane request failed (${response.status})`);
    return response;
  }
  /** Read/write this repository's GitHub API. T describes the expected JSON, not a schema validator. */
  async function gh<T>(path: string, init?: RequestInit): Promise<T> {
    return (await (await request(githubBase + path, githubToken, init)).json()) as T;
  }
  /** Read Cloudflare's result envelope and reject API-level failure even on an HTTP success. */
  async function cf<T>(url: string): Promise<T> {
    const body = (await (await request(url, cloudflareToken)).json()) as {
      success: boolean;
      result: T;
    };
    assert.equal(body.success, true, 'Cloudflare API reported failure');
    return body.result;
  }
  /**
   * Read the latest Cloudflare deployment and require one version receiving 100% traffic.
   * Split deployments are deliberately unsupported: byte verification and rollback
   * must refer to one unambiguous version. Throws for missing/ambiguous deployments.
   */
  async function active(): Promise<ActiveDeployment> {
    const result = await cf<{
      deployments: { id: string; versions: { version_id: string; percentage: number }[] }[];
    }>(worker + '/deployments');
    const latest = result.deployments[0];
    assert(
      latest && latest.versions.length === 1 && latest.versions[0]?.percentage === 100,
      'Expected an existing single-version deployment',
    );
    assert.match(latest.id, /^[a-f0-9-]{36}$/);
    assert.match(latest.versions[0].version_id, /^[a-f0-9-]{36}$/);
    return { deploymentId: latest.id, versionId: latest.versions[0].version_id };
  }
  /**
   * Find the newest matching verified-success record among the latest 100 GitHub
   * deployments for this Environment. Ignore unrelated/automatic Environment records.
   * A null result means none was found in this window, not that none ever existed;
   * the caller separately checks the live version before suppressing a duplicate.
   */
  async function verifiedSuccess(): Promise<SuccessfulDeployment | null> {
    const deployments = await gh<
      {
        id: number;
        payload: { source?: string; candidate?: ArtifactCandidate; identity?: ActiveDeployment };
      }[]
    >(`/deployments?environment=${kind}&per_page=100`);
    for (const deployment of deployments) {
      if (deployment.payload?.source !== 'tested-static-artifact') continue;
      const statuses = await gh<{ state: string }[]>(
        `/deployments/${deployment.id}/statuses?per_page=1`,
      );
      if (statuses[0]?.state !== 'success') continue;
      const { candidate: previous, identity } = deployment.payload;
      assert(previous && identity, 'Successful deployment record is missing identity');
      return {
        commit: previous.commit,
        artifactId: previous.id,
        artifactName: previous.name,
        versionId: identity.versionId,
      };
    }
    return null;
  }
  /**
   * Request the public site WITHOUT API credentials. Enforce the configured origin,
   * request revalidation and add a cache-busting query. Return redirects unchanged
   * so the caller can assert their status and destination instead of hiding them.
   */
  async function publicResponse(path: string) {
    // Revalidation plus a cache-busting query; never forward either API token.
    const url = new URL(path, origin);
    assert.equal(url.origin, origin);
    url.searchParams.set('__deployment_check', `${candidate.id}-${Date.now()}`);
    return fetch(url, {
      redirect: 'manual',
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(30_000),
    });
  }
  /**
   * Compare live directory-index pages and representative JS/CSS/JPG/PDF assets
   * with the tested bytes. Also check MIME types, staging-only noindex, real 404s
   * and every tested permanent redirect, then re-read the active deployment.
   *
   * @param identity Version/deployment observed immediately after the Wrangler action.
   * @throws On any mismatch; upload success alone must never become verified success.
   * Does not run a browser, test external video playback or prove cache behavior
   * globally. Redirect checks permit fragment inheritance but do not exercise it.
   */
  async function verifySite(identity: ActiveDeployment) {
    for (const file of files.filter((name) => name.endsWith('index.html'))) {
      const html = await readFile(join(directory, file));
      const $ = load(html.toString());
      // Alias documents remain portable, but are HTTP-redirected by this host.
      if ($('meta[http-equiv="refresh"]').length) continue;
      const path = '/' + file.replace(/index\.html$/, '');
      const response = await publicResponse(path);
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get('content-type') ?? '', /text\/html/);
      assert.equal(
        response.headers.get('x-robots-tag')?.includes('noindex') ?? false,
        kind === 'staging',
        'Unexpected search-indexing policy for deployment target',
      );
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), html, path);
    }
    const missing = await publicResponse(`/__deployment_missing_${candidate.id}/`);
    assert.equal(missing.status, 404);
    assert.deepEqual(
      Buffer.from(await missing.arrayBuffer()),
      await readFile(join(directory, '404.html')),
    );
    for (const line of (await readFile(join(directory, '_redirects'), 'utf8')).trim().split('\n')) {
      const [from, to, status] = line.split(/\s+/);
      assert(from && to && status === '301', 'Unexpected redirect contract');
      const response = await publicResponse(from);
      assert.equal(response.status, 301, from);
      const location = new URL(response.headers.get('location') ?? '', origin);
      assert.equal(location.origin, origin);
      assert.equal(location.pathname, to);
      assert.equal(location.hash, '', 'Redirect must allow browser fragment inheritance');
      assert(location.searchParams.has('__deployment_check'), 'Redirect lost query string');
    }
    for (const [extension, contentType] of [
      ['.js', /(?:javascript|ecmascript)/],
      ['.css', /^text\/css\b/],
      ['.jpg', /^image\/jpeg\b/],
      ['.pdf', /^application\/pdf\b/],
    ] as const) {
      const file = files.find((name) => name.endsWith(extension));
      assert(file, `Missing representative ${extension} asset`);
      const response = await publicResponse('/' + file);
      assert.equal(response.status, 200, file);
      assert.match(response.headers.get('content-type') ?? '', contentType, file);
      assert.deepEqual(
        Buffer.from(await response.arrayBuffer()),
        await readFile(join(directory, file)),
        file,
      );
    }
    // Public bytes alone are not sufficient proof that the intended version is active.
    assert.deepEqual(await active(), identity, 'Active deployment changed during verification');
  }
  /**
   * Append the observed outcome to the Actions summary and a GitHub Deployment record.
   * Within this process, pending/success/failure statuses share one record. Its payload
   * ties the artifact/commit to Cloudflare identity for later freshness checks.
   *
   * @param state Success is used only after HTTP and live-version checks pass.
   * @param identity Observed Cloudflare IDs, or null when an action failed before confirmation.
   * This is audit bookkeeping, not a Cloudflare mutation or rollback. API write errors
   * propagate so a missing success record cannot silently be treated as verification.
   */
  async function record(
    state: 'pending' | 'success' | 'failure',
    identity: ActiveDeployment | null,
  ) {
    if (env.GITHUB_STEP_SUMMARY)
      await appendFile(
        env.GITHUB_STEP_SUMMARY,
        `\n${state}: commit \`${candidate.commit}\`, artifact \`${candidate.id}\`, deployment \`${identity?.deploymentId ?? 'not confirmed'}\`, version \`${identity?.versionId ?? 'not confirmed'}\`.\n`,
      );
    if (!deploymentRecord) {
      const deployment = await gh<{ id: number }>('/deployments', {
        method: 'POST',
        body: JSON.stringify({
          ref: candidate.commit,
          environment: kind,
          auto_merge: false,
          required_contexts: [],
          production_environment: kind === 'production',
          transient_environment: kind === 'staging',
          payload: { source: 'tested-static-artifact', operation, candidate, identity },
        }),
      });
      deploymentRecord = deployment.id;
    }
    await gh(`/deployments/${deploymentRecord}/statuses`, {
      method: 'POST',
      body: JSON.stringify({
        state,
        environment_url: origin,
        log_url: runUrl,
        auto_inactive: false,
        description:
          state === 'failure'
            ? 'Upload or verification failed; inspect live state before recovery'
            : 'Exact tested static artifact',
      }),
    });
  }
  if (mode === 'upload-failed') {
    await record('failure', null);
    return;
  }
  files = await auditArtifact(directory);
  assert(
    files.includes('_headers') && files.includes('_redirects'),
    'Missing tested host configuration',
  );
  if (mode === 'prepare') {
    const installed = JSON.parse(
      await readFile(resolve('node_modules/wrangler/package.json'), 'utf8'),
    ) as { version: string };
    assert.equal(installed.version, WRANGLER_VERSION);
    const data = await gh<{
      id: number;
      name: string;
      expired: boolean;
      digest: string;
      workflow_run: { id: number; head_sha: string };
    }>(`/actions/artifacts/${candidate.id}`);
    verifyArtifactIdentity(candidate, {
      id: String(data.id),
      name: data.name,
      expired: data.expired,
      digest: data.digest,
      runId: String(data.workflow_run.id),
      commit: data.workflow_run.head_sha,
    });
    // download-artifact warns rather than fails on digest mismatch. This extra
    // check is deliberately fail-closed; the standard action still owns extraction.
    const response = await fetch(`${githubBase}/actions/artifacts/${candidate.id}/zip`, {
      redirect: 'manual',
      headers: { Authorization: `Bearer ${githubToken}` },
      signal: AbortSignal.timeout(60_000),
    });
    assert.equal(response.status, 302, 'Artifact download did not return a signed URL');
    const location = new URL(response.headers.get('location') ?? '');
    assert.equal(location.protocol, 'https:');
    const download = await fetch(location, {
      redirect: 'error',
      signal: AbortSignal.timeout(120_000),
    });
    assert.equal(download.status, 200, 'Artifact archive download failed');
    const bytes = Buffer.from(await download.arrayBuffer());
    assert(bytes.length <= 1024 ** 3, 'Archive exceeds project budget');
    verifyArchiveDigest(candidate.digest, createHash('sha256').update(bytes).digest('hex'));
    await writeFile(archive, bytes);
    execFileSync('python3', [resolve('scripts/verify-artifact.py'), archive, directory], {
      stdio: 'pipe',
    });
    const domains = await cf<{ hostname: string; service: string }[]>(cfBase + '/domains');
    if (kind === 'production') {
      // Refuse production provisioning or domain changes. Onboarding is separate.
      assert(
        domains.some(
          (domain) =>
            domain.hostname === new URL(origin).hostname && domain.service === config.name,
        ),
        'Production domain is not attached to the configured Worker',
      );
      if (operation === 'deploy') {
        const current = await active();
        const successful = await verifiedSuccess();
        const master = (await gh<{ object: { sha: string } }>('/git/ref/heads/master')).object.sha;
        const reason = candidateFreshness(candidate, master, successful, current.versionId);
        if (reason) {
          console.log(reason);
          if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, reason + '\n');
          return;
        }
      }
    } else {
      // Only manual staging can bootstrap a new dedicated Worker. Never attach DNS.
      assert(
        !domains.some((domain) => domain.service === config.name),
        'Staging Worker must not have a custom domain',
      );
      const subdomain = await cf<{ subdomain: string }>(cfBase + '/subdomain');
      assert.equal(
        origin,
        `https://${config.name}.${subdomain.subdomain}.workers.dev`,
        'Configured staging origin differs from the account workers.dev subdomain',
      );
      assert.deepEqual(await loadStagingCandidate(candidate.id, githubToken), candidate);
    }
    if (operation === 'rollback') {
      assert.deepEqual(await loadStagingCandidate(candidate.id, githubToken), candidate);
      const versionId = required('ROLLBACK_VERSION_ID');
      assert.match(versionId, /^[a-f0-9-]{36}$/, 'Invalid rollback version');
      const version = await cf<{ annotations?: Record<string, string> }>(
        worker + '/versions/' + versionId,
      );
      const retained = await cf<{ items: { id: string }[] }>(worker + '/versions?deployable=true');
      verifyRollbackSelection(
        versionId,
        required('EXPECTED_CURRENT_VERSION'),
        (await active()).versionId,
        retained.items.map((item) => item.id),
        version.annotations?.['workers/message'],
        message,
      );
      await appendFile(required('GITHUB_OUTPUT'), `rollback-version=${versionId}\n`);
    }
    await writeFile(join(root, `wrangler-${kind}.json`), JSON.stringify(config));
    await appendFile(required('GITHUB_OUTPUT'), `deploy=true\nmessage=${message}\n`);
    return;
  }
  let identity: ActiveDeployment | null = null;
  try {
    identity = await active();
    if (operation === 'rollback')
      assert.equal(
        identity.versionId,
        required('ROLLBACK_VERSION_ID'),
        'Requested rollback version is not active',
      );
    const version = await cf<{ annotations?: Record<string, string> }>(
      worker + '/versions/' + identity.versionId,
    );
    assert.equal(
      version.annotations?.['workers/message'],
      message,
      'Uploaded version does not match the tested artifact',
    );
    await record('pending', identity);
    await verifySite(identity);
    await record('success', identity);
  } catch (error) {
    await record('failure', identity);
    throw error;
  }
}
