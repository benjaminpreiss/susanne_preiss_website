import { chromium, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';

const output = process.argv[2];
if (!output) throw new Error('Supply a new evidence directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const replay = process.env.TEST_LOCAL_BUILD === '1';
async function createContext(options: Parameters<typeof browser.newContext>[0] = {}) {
  const context = await browser.newContext(options);
  if (replay)
    await context.route(`${site}/**`, async (route) => {
      const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
      const file = resolve(
        'dist',
        `.${pathname}`,
        ...(pathname.endsWith('/') ? ['index.html'] : []),
      );
      if (!file.startsWith(resolve('dist') + '/')) return route.abort();
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
  return context;
}
const errors: string[] = [];
const results: unknown[] = [];
async function settled(page: Page, path: string) {
  // ClientRouter Back may swap the document without a new load/DOMContentLoaded event.
  await page.waitForURL((url) => url.pathname === path, { waitUntil: 'commit' });
  await page.waitForFunction(
    () =>
      !document.documentElement.dataset.routePhase && !document.querySelector('astro-island[ssr]'),
  );
  assert.equal(await page.evaluate(() => document.body.style.position), '');
  assert.deepEqual(
    await page
      .locator('main')
      .evaluate((node) =>
        node instanceof HTMLElement ? [node.style.transform, node.style.opacity] : null,
      ),
    ['', ''],
  );
}
try {
  for (const mobile of [false, true])
    for (const menu of [false, true]) {
      const context = await createContext({
        viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
      });
      try {
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${site}/ueber-mich/`, { waitUntil: 'networkidle' });
        await settled(page, '/ueber-mich/');
        const origin = await page.evaluate(() => performance.timeOrigin);
        const target = menu ? '/workshops/' : '/impressum/';
        let failedFetches = 0;
        let documentNavigations = 0;
        await context.route(site + target, async (route) => {
          if (route.request().isNavigationRequest()) {
            documentNavigations++;
            await route.fallback();
          } else {
            failedFetches++;
            await route.abort('connectionfailed');
          }
        });
        if (menu) {
          await page.locator('#menu-trigger').click();
          await page.locator(`dialog a[href="${target}"]`).click();
        } else await page.locator('#footer-imprint').click();
        await settled(page, target);
        assert.ok(failedFetches > 0);
        assert.equal(documentNavigations, 1);
        assert.notEqual(await page.evaluate(() => performance.timeOrigin), origin);
        await page.goBack({ waitUntil: 'commit' });
        await settled(page, '/ueber-mich/');
        await page.locator('#menu-trigger').click();
        await page.keyboard.press('Escape');
        await page.waitForFunction(
          () => !document.querySelector('dialog')?.open && document.body.style.position === '',
        );
        results.push({
          scenario: 'failed router fetch falls back to real document, Back/menu recovery',
          mobile,
          menu,
          failedFetches,
          documentNavigations,
        });
      } finally {
        await context.close();
      }
    }
  const storage = await createContext({ reducedMotion: 'reduce' });
  try {
    await storage.addInitScript(() =>
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new DOMException('Test: disabled storage', 'SecurityError');
        },
      }),
    );
    const page = await storage.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${site}/ueber-mich/`, { waitUntil: 'networkidle' });
    await settled(page, '/ueber-mich/');
    await page.locator('#footer-imprint').focus();
    await page.keyboard.press('Enter');
    await settled(page, '/impressum/');
    await page.locator('#page-return').focus();
    await page.keyboard.press('Enter');
    await settled(page, '/ueber-mich/');
    assert.equal(
      await page.locator('#footer-imprint').evaluate((node) => node === document.activeElement),
      true,
    );
    results.push({
      scenario: 'disabled sessionStorage, keyboard navigation and return focus',
      status: 'passed',
    });
  } finally {
    await storage.close();
  }
  const outage = await createContext();
  try {
    const page = await outage.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${site}/ueber-mich/`, { waitUntil: 'networkidle' });
    await settled(page, '/ueber-mich/');
    await outage.route(`${site}/impressum/`, (route) => route.abort('connectionfailed'));
    const failed = page.waitForEvent('requestfailed', {
      predicate: (request) =>
        request.isNavigationRequest() && request.url() === `${site}/impressum/`,
    });
    await page.locator('#footer-imprint').click();
    await failed;
    await page.waitForLoadState('load');
    await outage.unroute(`${site}/impressum/`);
    await page.goto(`${site}/impressum/`, { waitUntil: 'networkidle' });
    await settled(page, '/impressum/');
    results.push({
      scenario: 'complete outage attempts document navigation; explicit online retry recovers',
      status: 'passed',
    });
  } finally {
    await outage.close();
  }
  const history = await createContext({ reducedMotion: 'reduce' });
  try {
    const page = await history.newPage();
    const persisted: boolean[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.text().startsWith('cutover-pageshow:'))
        persisted.push(message.text() === 'cutover-pageshow:true');
    });
    await page.addInitScript(() =>
      addEventListener('pageshow', (event) => console.log('cutover-pageshow:' + event.persisted)),
    );
    await page.goto(`${site}/ueber-mich/`, { waitUntil: 'networkidle' });
    await settled(page, '/ueber-mich/');
    await page.locator('#menu-trigger').click();
    const link = page.locator('dialog a[href="/workshops/"]');
    await link.evaluate((node) => node.setAttribute('data-astro-reload', ''));
    await link.click();
    await settled(page, '/workshops/');
    await page.goBack({ waitUntil: 'commit' });
    await settled(page, '/ueber-mich/');
    assert.equal(
      await page
        .locator('dialog')
        .evaluate((node) => node instanceof HTMLDialogElement && node.open),
      false,
    );
    await page.locator('#menu-trigger').click();
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => !document.querySelector('dialog')?.open && document.body.style.position === '',
    );
    results.push({
      scenario: 'real document departure with menu open and Back recovery',
      persistedPageShows: persisted.filter(Boolean).length,
      bfcache: persisted.includes(true) ? 'observed' : 'not observed; full-document Back only',
    });
  } finally {
    await history.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify(
      {
        site,
        replay,
        networkFaultInjection: true,
        browser: browser.version(),
        results,
        errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
