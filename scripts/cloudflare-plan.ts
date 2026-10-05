/**
 * @file Pure deployment rules shared by the Actions scripts and unit tests.
 *
 * These functions do not fetch APIs, read secrets, write files or deploy anything.
 * Gate/freshness functions return a reason to skip, or null to proceed. Verification
 * functions throw on invalid input so their calling workflow step fails closed.
 * The workflows, not this module, acquire the per-target concurrency lock.
 */
import { isAbsolute } from 'node:path';

// Reviewed against the 4.147.0 package schema and official Wrangler docs.
// The standard upload action must use this exact version, not Wrangler's latest tag.
export const WRANGLER_VERSION = '4.147.0';

/** GitHub trigger context plus the enable flag read inside the selected Environment. */
export type DeploymentEvent = {
  event: string;
  ref: string;
  actor: string;
  enabled?: string;
};

/**
 * Decide whether an automatic production deployment is eligible.
 * Only non-Renovate master pushes with a literal "true" enable flag may proceed.
 * The workflow also checks eligibility before exposing deployment credentials.
 *
 * @param input GitHub event details and Environment-level opt-in value.
 * @returns A human-readable skip reason, or null when eligible.
 */
export function productionGate(input: DeploymentEvent): string | null {
  if (input.event !== 'push' || input.ref !== 'refs/heads/master')
    return 'Only master push events may deploy production';
  if (/^renovate(?:\[bot\]|-bot)?$/i.test(input.actor))
    return 'Renovate validation runs do not deploy';
  if (input.enabled !== 'true') return 'Production deployment is disabled';
  return null;
}

/**
 * Require both persistent staging opt-in and approval of this particular manual run.
 * Unlike production, staging never deploys automatically on a push.
 * @returns A skip reason, or null for an approved manual dispatch from master.
 */
export function stagingGate(input: DeploymentEvent & { approved?: string }): string | null {
  if (input.event !== 'workflow_dispatch' || input.ref !== 'refs/heads/master')
    return 'Staging requires a manual workflow dispatch from master';
  if (input.approved !== 'true') return 'This staging deployment was not explicitly approved';
  if (input.enabled !== 'true') return 'Staging deployment is disabled';
  return null;
}

/**
 * Require a separately enabled and approved manual rollback.
 * Production must explicitly pause automatic deployment first, so a queued master
 * run cannot immediately undo the rollback. This check does not change any flags.
 * @returns A skip reason, or null when rollback is eligible.
 */
export function rollbackGate(
  input: DeploymentEvent & {
    approved?: string;
    rollbackEnabled?: string;
    kind: 'production' | 'staging';
  },
): string | null {
  if (input.event !== 'workflow_dispatch' || input.ref !== 'refs/heads/master')
    return 'Rollback requires a manual workflow dispatch from master';
  if (input.approved !== 'true' || input.rollbackEnabled !== 'true')
    return 'Rollback is not explicitly approved and enabled';
  if (input.kind === 'production' && input.enabled !== 'false')
    return 'Set production deployment enable to false before rollback';
  return null;
}

/**
 * Check that the owner's rollback choice still describes the live target.
 * Call under the target lock using fresh Cloudflare reads, before invoking Wrangler.
 *
 * @param versionId Explicit version UUID to restore, never "previous" or "latest".
 * @param expectedCurrent Active version UUID the owner approved replacing.
 * @param activeVersion Version UUID currently serving traffic.
 * @param retainedVersionIds Versions Cloudflare currently reports as deployable.
 * @param versionMessage Original annotation on the selected version.
 * @param candidateMessage Expected annotation tying that version to the tested artifact.
 * @throws If IDs are invalid, the target changed, retention expired or identity differs.
 */
export function verifyRollbackSelection(
  versionId: string,
  expectedCurrent: string,
  activeVersion: string,
  retainedVersionIds: string[],
  versionMessage: string | undefined,
  candidateMessage: string,
) {
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  if (!uuid.test(versionId) || !uuid.test(expectedCurrent))
    throw new Error('Select explicit version UUIDs');
  if (activeVersion !== expectedCurrent)
    throw new Error('Active version changed since rollback approval');
  if (!retainedVersionIds.includes(versionId))
    throw new Error('Rollback version is not deployable/retained');
  if (versionMessage !== candidateMessage)
    throw new Error('Rollback version does not match selected artifact');
}

type Target = {
  accountId: string;
  workerName: string;
  origin: string;
  kind: 'staging' | 'production';
};

/**
 * Validate a target and return an assets-only Wrangler configuration.
 * Staging uses a dedicated workers.dev hostname; production uses the confirmed
 * canonical origin. Directory indexes and real 404s are enabled, not SPA fallback.
 * No application Worker, build command or DNS route configuration is added.
 *
 * @param target Intended account, Worker, HTTPS origin and environment kind.
 * @param artifactDirectory Absolute path to the already-downloaded tested files.
 * @returns Configuration data only; the caller writes it OUTSIDE the asset directory.
 * @throws If the target or path is invalid. Does not prove live ownership or permissions.
 */
export function workersConfig(target: Target, artifactDirectory: string) {
  if (!/^[a-f0-9]{32}$/.test(target.accountId)) throw new Error('Invalid Cloudflare account ID');
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(target.workerName))
    throw new Error('Invalid Cloudflare Worker name');
  if (!isAbsolute(artifactDirectory)) throw new Error('Artifact directory must be absolute');
  const origin = new URL(target.origin);
  if (target.origin !== origin.origin || origin.protocol !== 'https:' || origin.port)
    throw new Error('Target must be a bare HTTPS origin');
  if (target.kind === 'production') {
    if (target.origin !== 'https://susanne-preiss.de')
      throw new Error('Production origin must match the owner-confirmed build origin');
    if (target.workerName.endsWith('-staging')) throw new Error('Staging name used for production');
  } else if (target.kind === 'staging') {
    const expected = new RegExp(`^${target.workerName}\\.[a-z0-9-]+\\.workers\\.dev$`);
    if (!target.workerName.endsWith('-staging') || !expected.test(origin.hostname))
      throw new Error('Staging requires a dedicated -staging Worker on workers.dev');
  } else {
    throw new Error('Unknown target kind');
  }
  return {
    name: target.workerName,
    account_id: target.accountId,
    compatibility_date: '2026-10-04',
    workers_dev: target.kind === 'staging',
    preview_urls: false,
    // Deliberately omit routes: domain onboarding is an owner-approved dashboard
    // step. An ordinary upload must not create DNS records or manage domain routes.
    // No main, bindings, build command, functions or SSR adapter.
    assets: {
      directory: artifactDirectory,
      html_handling: 'force-trailing-slash',
      not_found_handling: '404-page',
      run_worker_first: false,
    },
  };
}

/**
 * Expected identity of the tested output, supplied by validation or explicit selection.
 * IDs are decimal strings; commit is a full SHA; digest is "sha256:<hex>" of the ZIP.
 * The name encodes the original commit, run ID and build attempt, even on a deploy retry.
 */
export type ArtifactCandidate = {
  id: string;
  name: string;
  commit: string;
  runId: string;
  digest: string;
};

/**
 * Actual artifact metadata read from GitHub by immutable artifact ID.
 * Production uses its current run; manual staging/rollback validates a selected
 * retained artifact's source run separately. Compare this with ArtifactCandidate.
 */
export type ArtifactMetadata = {
  id: string;
  name: string;
  expired: boolean;
  digest: string;
  runId: string;
  commit: string;
};

/**
 * Bind the expected artifact to GitHub's metadata: ID, name, source run, commit and digest.
 * The original build-attempt suffix is retained; rerunning deployment does not rebuild.
 * This checks association/expiry, not downloaded bytes or source-run success.
 * @throws If the identity is malformed, expired or differs from the expected output.
 */
export function verifyArtifactIdentity(candidate: ArtifactCandidate, metadata: ArtifactMetadata) {
  if (!/^[a-f0-9]{40}$/.test(candidate.commit)) throw new Error('Invalid tested commit');
  if (![candidate.id, candidate.runId].every((value) => /^[1-9][0-9]*$/.test(value)))
    throw new Error('Invalid artifact/run ID');
  // A retry of just the deploy job retains the original artifact attempt. Do not
  // require its attempt suffix to equal the current github.run_attempt.
  const pattern = new RegExp(`^static-${candidate.commit}-${candidate.runId}-[1-9][0-9]*$`);
  if (!pattern.test(candidate.name))
    throw new Error('Artifact name is not associated with this run');
  if (!/^sha256:[a-f0-9]{64}$/.test(candidate.digest)) throw new Error('Missing artifact digest');
  if (
    metadata.expired ||
    metadata.id !== candidate.id ||
    metadata.name !== candidate.name ||
    metadata.runId !== candidate.runId ||
    metadata.commit !== candidate.commit ||
    metadata.digest !== candidate.digest
  )
    throw new Error('Artifact metadata does not match the tested output');
}

/** Source workflow details needed to exclude PRs, forks and failed validation runs. */
export type ValidationRun = {
  id: string;
  commit: string;
  repository: string;
  headRepository: string;
  branch: string;
  event: string;
  path: string;
  status: string;
  conclusion: string | null;
};

/**
 * Turn a manually selected artifact into a candidate only after checking its source run.
 * Used by staging AND rollback despite the name. Historical successful master output
 * is allowed, but PRs, forks, other workflows and unfinished/failed runs are rejected.
 *
 * @param metadata Artifact metadata fetched by its explicit ID.
 * @param run Source validation run fetched using the artifact's run ID.
 * @returns The validated identity to pass between workflow steps.
 * @throws If the source run is ineligible or the artifact identity/expiry check fails.
 */
export function stagingCandidate(
  metadata: ArtifactMetadata,
  run: ValidationRun,
): ArtifactCandidate {
  if (
    run.repository !== 'benjaminpreiss/susanne_preiss_website' ||
    run.headRepository !== run.repository ||
    run.branch !== 'master' ||
    run.event !== 'push' ||
    run.path !== '.github/workflows/validate.yml' ||
    run.status !== 'completed' ||
    run.conclusion !== 'success' ||
    run.id !== metadata.runId ||
    run.commit !== metadata.commit
  )
    throw new Error('Staging requires an artifact from a successful master validation run');
  const candidate: ArtifactCandidate = {
    id: metadata.id,
    name: metadata.name,
    commit: metadata.commit,
    runId: metadata.runId,
    digest: metadata.digest,
  };
  verifyArtifactIdentity(candidate, metadata);
  return candidate;
}

/**
 * Fail the workflow on a ZIP checksum mismatch, not merely warn like download-artifact.
 * This checks archive bytes; the Python verifier separately compares extracted files.
 * @param expected Upload-service digest in "sha256:<hex>" form.
 * @param actualSha256 SHA-256 of the downloaded ZIP as bare lowercase hexadecimal.
 * @throws If the expected digest is missing/malformed or the bytes do not match.
 */
export function verifyArchiveDigest(expected: string, actualSha256: string) {
  if (!/^sha256:[a-f0-9]{64}$/.test(expected) || expected !== `sha256:${actualSha256}`)
    throw new Error('Downloaded artifact integrity check failed');
}

/** Identity from a GitHub Deployment record whose latest status is verified success. */
export type SuccessfulDeployment = {
  commit: string;
  artifactId: string;
  versionId: string;
  artifactName?: string;
};

/**
 * Prevent automatic production runs from deploying stale or redundant output.
 * Reject a moved master or an older successful-commit attempt; skip an exact duplicate
 * only while its verified version is still active. Failed verification remains retryable.
 * Manual historical staging/rollback intentionally does not use this freshness rule.
 *
 * @param candidate Previously validated artifact identity proposed for deployment.
 * @param masterCommit Current master SHA, fetched under the shared target lock.
 * @param successful Prior verified-success identity, or null if none was found.
 * @param activeVersionId Currently active Cloudflare version, or null if unknown.
 * @returns A skip reason, or null to proceed. Does not acquire a lock or upload assets.
 * @throws If master or the attempt identities cannot be compared safely.
 */
export function candidateFreshness(
  candidate: ArtifactCandidate,
  masterCommit: string,
  successful: SuccessfulDeployment | null,
  activeVersionId: string | null,
): string | null {
  if (!/^[a-f0-9]{40}$/.test(masterCommit)) throw new Error('Cannot verify current master');
  if (candidate.commit !== masterCommit) return 'Skipped stale candidate: master has moved';
  if (successful?.commit === candidate.commit && successful.artifactName) {
    const previous = /^static-[a-f0-9]{40}-([1-9][0-9]*)-([1-9][0-9]*)$/.exec(
      successful.artifactName,
    );
    const incoming = /^static-[a-f0-9]{40}-([1-9][0-9]*)-([1-9][0-9]*)$/.exec(candidate.name);
    if (!previous || !incoming) throw new Error('Cannot compare deployment attempts');
    if (
      BigInt(incoming[1]!) < BigInt(previous[1]!) ||
      (incoming[1] === previous[1] && BigInt(incoming[2]!) < BigInt(previous[2]!))
    )
      return 'Skipped stale candidate: a newer artifact of this commit already succeeded';
  }
  // Do not suppress retries after a failed post-upload check, a manual change or
  // rollback. Only an exact, still-active, VERIFIED success is a duplicate.
  if (
    successful?.commit === candidate.commit &&
    successful.artifactId === candidate.id &&
    successful.versionId === activeVersionId
  )
    return 'Skipped duplicate: this exact artifact is already active and verified';
  return null;
}
