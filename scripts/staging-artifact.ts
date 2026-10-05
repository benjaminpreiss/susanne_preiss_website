/**
 * @file Resolve a manually selected artifact for staging or rollback, without deploying.
 *
 * The CLI reads ARTIFACT_ID and GH_TOKEN, verifies the artifact and its source run,
 * and writes identity fields to GITHUB_OUTPUT for the standard download action.
 * The source run may differ from the current manual run; both are identified explicitly.
 * Importing this module performs no lookup. The exported function supports mocked fetch.
 */
import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stagingCandidate } from './cloudflare-plan';

/**
 * Fetch one artifact by immutable ID, then verify its original validation run.
 * Shared by staging and rollback despite the name. Never searches for "latest",
 * downloads/extracts assets, checks out source or rebuilds anything.
 *
 * @param id One decimal GitHub artifact ID, not a run ID or artifact name.
 * @param token GitHub token with artifact/run read access; never sent to Cloudflare.
 * @param request Fetch implementation; injectable so tests cannot make live requests.
 * @returns A candidate from a completed successful master validation in this repository.
 * @throws For invalid IDs, missing credentials, API errors, expiry or ineligible source runs.
 */
export async function loadStagingCandidate(id: string, token: string, request = fetch) {
  assert.match(id, /^[1-9][0-9]*$/, 'Select one numeric artifact ID');
  assert(token.trim(), 'Missing GitHub read token');
  const base = 'https://api.github.com/repos/benjaminpreiss/susanne_preiss_website';
  /** Read a repository-local API path; reject redirects/errors before interpreting its JSON. */
  async function get<T>(path: string): Promise<T> {
    const response = await request(base + path, {
      redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Artifact lookup failed (${response.status})`);
    return (await response.json()) as T;
  }
  const artifact = await get<{
    id: number;
    name: string;
    expired: boolean;
    digest: string;
    workflow_run: { id: number; head_sha: string };
  }>(`/actions/artifacts/${id}`);
  assert.equal(String(artifact.id), id, 'Artifact lookup returned a different ID');
  const runId = String(artifact.workflow_run.id);
  assert.match(runId, /^[1-9][0-9]*$/);
  const run = await get<{
    id: number;
    head_sha: string;
    head_branch: string;
    event: string;
    path: string;
    status: string;
    conclusion: string | null;
    repository: { full_name: string };
    head_repository: { full_name: string };
  }>(`/actions/runs/${runId}`);
  return stagingCandidate(
    {
      id,
      name: artifact.name,
      expired: artifact.expired,
      digest: artifact.digest,
      commit: artifact.workflow_run.head_sha,
      runId,
    },
    {
      id: String(run.id),
      commit: run.head_sha,
      repository: run.repository.full_name,
      headRepository: run.head_repository.full_name,
      branch: run.head_branch,
      event: run.event,
      path: run.path,
      status: run.status,
      conclusion: run.conclusion,
    },
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.env.GITHUB_REPOSITORY, 'benjaminpreiss/susanne_preiss_website');
  const candidate = await loadStagingCandidate(
    process.env.ARTIFACT_ID ?? '',
    process.env.GH_TOKEN ?? '',
  );
  assert(process.env.GITHUB_OUTPUT, 'Missing Actions output file');
  await appendFile(
    process.env.GITHUB_OUTPUT,
    [
      `artifact-id=${candidate.id}`,
      `artifact-name=${candidate.name}`,
      `artifact-digest=${candidate.digest.slice('sha256:'.length)}`,
      `source-run-id=${candidate.runId}`,
      `tested-commit=${candidate.commit}`,
      '',
    ].join('\n'),
  );
}
