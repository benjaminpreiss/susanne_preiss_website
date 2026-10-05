import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

// Use the controlled editorial fixture, never production section names or copy.
const [fixture, destination] = process.argv.slice(2);
if (!fixture || !destination)
  throw new Error(
    'Usage: tsx tests/homepage-options-browser.ts <fixture dist> <new report directory>',
  );
const root = resolve(fixture);
const output = resolve(destination);
await mkdir(output, { recursive: false });
const site = 'http://127.0.0.1:4321';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const errors: string[] = [];
const results: unknown[] = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  try {
    await context.route(`${site}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
      };
      try {
        await route.fulfill({
          body: await readFile(file),
          contentType: types[extname(file)] ?? 'application/octet-stream',
        });
      } catch {
        await route.fulfill({ status: 404 });
      }
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(site);
    await page.waitForFunction(() => document.documentElement.dataset.homeSection === 'intro');
    assert.equal(
      await page.locator('.site-header').evaluate((el) => getComputedStyle(el).opacity),
      '1',
    );
    // The same section must update its tone on rotation, not just on scrolling.
    for (const [width, height] of [
      [390, 844],
      [1440, 900],
      [390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      assert.equal(
        await page.locator('.home-intro img').evaluate((el) => getComputedStyle(el).objectPosition),
        width < height ? '0% 0%' : '100% 100%',
      );
      for (const [key, mobileTone, crop, arrow] of [
        ['tile', 'dark', width < height ? '20% 40%' : '30% 70%', 'inline'],
        ['another-tile', 'light', '50% 0%', 'below'],
      ] as const) {
        const section = page.locator(`[data-home-section="${key}"].home-section`);
        await section.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
        await page.waitForFunction(
          (key) => document.documentElement.dataset.homeSection === key,
          key,
        );
        const expected =
          width < height && mobileTone === 'dark' ? 'rgb(43, 44, 54)' : 'rgb(239, 234, 227)';
        await page.waitForFunction(
          (expected) =>
            getComputedStyle(document.querySelector('.site-header .menu')!).color === expected,
          expected,
        );
        assert.equal(
          await section.locator('img').evaluate((el) => getComputedStyle(el).objectPosition),
          crop,
        );
        assert.equal(
          await section.locator('.home-arrow').evaluate((el) => getComputedStyle(el).display),
          arrow === 'inline' ? 'none' : 'block',
        );
        const hidden = key === 'tile';
        assert.equal(
          await page.locator('html').getAttribute('data-home-navigation-hidden'),
          hidden ? '' : null,
        );
        await page.waitForFunction(
          (hidden) =>
            getComputedStyle(document.querySelector('.site-header')!).opacity ===
            (hidden ? '0' : '1'),
          hidden,
        );
        if (hidden) {
          await page.keyboard.press('Tab');
          await page.locator('.site-header .menu').focus();
          await page.waitForFunction(
            () => getComputedStyle(document.querySelector('.site-header')!).opacity === '1',
          );
          await page.locator('.site-header .menu').evaluate((el) => el.blur());
        }
        results.push({ width, height, key, menu: expected, crop, arrow });
      }
    }
    await page.locator('#section-tile .home-tile-link').click();
    await page.waitForURL('**/workshops/');
    await page.waitForFunction(() => document.documentElement.dataset.pageKind !== 'home');
    assert.equal(await page.locator('html').getAttribute('data-home-mobile-menu-tone'), null);
    assert.equal(await page.locator('html').getAttribute('data-home-navigation-hidden'), null);
    await page.goBack();
    await page.waitForFunction(() => document.documentElement.dataset.homeSection !== undefined);
    await page.locator('.home-intro').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => document.documentElement.dataset.homeSection === 'intro');
    assert.equal(await page.locator('html').getAttribute('data-home-navigation-hidden'), null);
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector('.site-header')!).opacity === '1',
    );
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2));
}
