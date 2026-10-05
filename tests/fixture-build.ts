import { cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Copy only content-addressed image transformations, never content stores or HTML.
// Each fixture owns its copy, so changes cannot pollute production or other fixtures.
export async function seedImageCache(
  fixture: string,
  source = resolve('node_modules/.astro/assets'),
) {
  await cp(source, join(fixture, 'node_modules/.astro/assets'), { recursive: true }).catch(
    (error: unknown) => {
      throw new Error('Cannot seed fixture image cache; run pnpm build before pnpm test.', {
        cause: error,
      });
    },
  );
}

export function buildFixture(fixture: string) {
  const result = spawnSync(
    process.execPath,
    [resolve('node_modules/astro/bin/astro.mjs'), 'build'],
    {
      cwd: fixture,
      encoding: 'utf8',
      timeout: 120_000,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    },
  );
  // Process failures must not be mistaken for expected content-validation failures.
  if (result.error || result.signal) {
    throw new Error(
      `Fixture build did not complete (120s limit): ${result.error?.message ?? result.signal}\n${result.stdout}\n${result.stderr}`,
      { cause: result.error },
    );
  }
  return result;
}
