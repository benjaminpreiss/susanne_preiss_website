import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const output = process.argv[2];
if (!output) throw new Error('Supply a new capture directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const root = resolve('dist');
const replay = process.env.TEST_LOCAL_BUILD === '1';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: unknown[] = [];
const failures: string[] = [];
const errors: string[] = [];
try {
  for (const slug of ['workshops', 'nachhaltigkeit']) {
    for (const mobile of [false, true]) {
      for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        const name = `${slug}-${mobile ? 'mobile' : 'desktop'}-${reducedMotion}`;
        const context = await browser.newContext({
          viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
          reducedMotion,
        });
        try {
          if (replay)
            await context.route(`${site}/**`, async (route) => {
              const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
              const file = resolve(
                root,
                '.' + pathname,
                ...(pathname.endsWith('/') ? ['index.html'] : []),
              );
              if (!file.startsWith(root + '/')) return route.abort();
              try {
                const contentType = file.endsWith('.html')
                  ? 'text/html'
                  : file.endsWith('.js')
                    ? 'text/javascript'
                    : file.endsWith('.css')
                      ? 'text/css'
                      : file.endsWith('.svg')
                        ? 'image/svg+xml'
                        : file.endsWith('.jpg')
                          ? 'image/jpeg'
                          : 'application/octet-stream';
                await route.fulfill({ body: await readFile(file), contentType });
              } catch {
                await route.fulfill({ status: 404 });
              }
            });
          const page = await context.newPage();
          page.on('pageerror', (error) => errors.push(`${name}: ${error}`));
          await page.goto(`${site}/${slug}/`, { waitUntil: 'domcontentloaded' });
          const opener = page.locator('#menu-trigger');
          assert.equal(await opener.count(), 1);
          assert.equal(await page.locator('.dismiss-menu').count(), 1);
          await opener.click();
          await page.waitForTimeout(reducedMotion === 'reduce' ? 0 : 200);
          await page.screenshot({ path: join(output, `${name}-opening.png`) });
          await page.waitForFunction(() => {
            const nav = document.querySelector('dialog[open] .main-navigation');
            return nav && Number(getComputedStyle(nav).opacity) === 1;
          });
          const opened = await opener.evaluate((node) => {
            const style = getComputedStyle(node);
            return {
              visibility: style.visibility,
              opacity: style.opacity,
              color: style.color,
              expanded: node.getAttribute('aria-expanded'),
            };
          });
          await page.screenshot({ path: join(output, `${name}-open.png`) });
          if (await opener.isVisible())
            failures.push(`${name}: opener visible behind close button`);
          assert.equal(await page.locator('.dismiss-menu').isVisible(), true);
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => !document.querySelector('dialog[open]'));
          assert.equal(await opener.isVisible(), true, 'Opener returns after closing');
          assert.equal(
            await opener.evaluate((node) => node === document.activeElement),
            true,
            'Close restores opener focus',
          );
          await opener.click();
          await page.waitForFunction(() => {
            const nav = document.querySelector('dialog[open] .main-navigation');
            return nav && Number(getComputedStyle(nav).opacity) === 1;
          });
          // Sample the old opener throughout exit and swap, not just the settled menu.
          await page.evaluate(() => {
            const opener = document.querySelector('#menu-trigger')!;
            (window as any).__toggleSamples = [];
            void (async () => {
              while (opener.isConnected) {
                const style = getComputedStyle(opener);
                (window as any).__toggleSamples.push({
                  phase: document.documentElement.dataset.routePhase,
                  hidden: style.visibility === 'hidden' || Number(style.opacity) === 0,
                });
                await new Promise(requestAnimationFrame);
              }
            })();
          });
          await page.locator('dialog[open] a[href="/presse/"]').click();
          await page.waitForURL('**/presse/');
          await page.waitForFunction(
            () =>
              !document.documentElement.dataset.routePhase &&
              !document.querySelector('astro-island[ssr]'),
          );
          const samples = await page.evaluate(
            () => (window as any).__toggleSamples as { hidden: boolean; phase?: string }[],
          );
          if (samples.some((sample) => !sample.hidden))
            failures.push(`${name}: old opener reappears during menu departure`);
          assert.equal(
            await page.locator('#menu-trigger').isVisible(),
            true,
            'Destination opener is visible',
          );
          assert.equal(await page.locator('dialog[open]').count(), 0);
          results.push({ name, opened, samples });
        } finally {
          await context.close();
        }
      }
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(
    failures,
    [],
    'Exactly one visible navigation toggle through open, close and departure',
  );
} finally {
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify({ replay, results, failures, errors }, null, 2),
  );
  await browser.close();
}
