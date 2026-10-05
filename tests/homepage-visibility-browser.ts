import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const output = process.argv[2];
if (!output) throw new Error('Supply a new evidence directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const replay = process.env.TEST_LOCAL_BUILD === '1';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: unknown[] = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: mobile ? 3 : 1,
    });
    try {
      if (replay)
        await context.route(`${site}/**`, async (route) => {
          const path = decodeURIComponent(new URL(route.request().url()).pathname);
          const file = resolve('dist', `.${path}`, ...(path.endsWith('/') ? ['index.html'] : []));
          if (!file.startsWith(resolve('dist') + '/')) return route.abort();
          // Expose the prerendered first paint rather than hiding it behind fast local hydration.
          if (file.endsWith('.js')) await new Promise((done) => setTimeout(done, 300));
          try {
            await route.fulfill({ path: file });
          } catch {
            await route.fulfill({ status: 404, body: 'Missing file' });
          }
        });
      await context.addInitScript(() => {
        const visibleFrames: number[] = [];
        Object.assign(window, { visibleFrames });
        function frame() {
          const header = document.querySelector('.site-header');
          if (header && scrollY === 0 && Number(getComputedStyle(header).opacity) > 0.01)
            visibleFrames.push(performance.now());
          if (document.readyState !== 'complete') requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
      const page = await context.newPage();
      await page.goto(`${site}/`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      const fresh = await page.evaluate(
        () => (window as unknown as { visibleFrames: number[] }).visibleFrames,
      );
      results.push({ mobile, fresh });
      assert.deepEqual(fresh, [], 'No visible header frame on a cold first-slide load');
      await page
        .locator('#section-workshops')
        .evaluate((node) => node.scrollIntoView({ behavior: 'instant' }));
      await page.waitForFunction(
        () => document.documentElement.dataset.homeSection === 'workshops',
      );
      await page.locator('#menu-trigger').click();
      await page.waitForTimeout(1300);
      await page.locator('.dismiss-menu').click();
      await page.waitForFunction(() => !document.querySelector('dialog[open]'));
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'menu-trigger');
      await page
        .locator('#greatness')
        .evaluate((node) => node.scrollIntoView({ behavior: 'instant' }));
      await page.waitForTimeout(600);
      const returned = await page.locator('.site-header').evaluate((node) => ({
        opacity: getComputedStyle(node).opacity,
        focused: document.activeElement?.id,
        input: document.documentElement.dataset.inputModality,
      }));
      results.push({ mobile, returned });
      assert.equal(
        returned.opacity,
        '0',
        'Pointer focus retained after menu closure must not keep the header visible on slide one',
      );
      await page.reload({ waitUntil: 'networkidle' });
      const reload = await page.evaluate(
        () => (window as unknown as { visibleFrames: number[] }).visibleFrames,
      );
      results.push({ mobile, reload });
      assert.deepEqual(reload, [], 'No header blink when reloading at slide one');
      // Keyboard focus must remain visible and the menu operable on the introduction.
      await page.keyboard.press('Tab');
      await page.locator('#menu-trigger').focus();
      await page.waitForTimeout(450);
      assert.equal(
        await page.locator('.site-header').evaluate((node) => getComputedStyle(node).opacity),
        '1',
      );
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !!document.querySelector('dialog[open]'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('dialog[open]'));
      await page.screenshot({
        path: join(output, `${mobile ? 'mobile' : 'desktop'}-keyboard.png`),
      });
    } finally {
      await context.close();
    }
  }
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify({ replay, results }, null, 2));
  await browser.close();
}
