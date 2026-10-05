import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const output = process.argv[2];
if (!output) throw new Error('Supply a NEW capture directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const replay = process.env.TEST_LOCAL_BUILD === '1';
const legacy = process.env.TEST_LEGACY === '1';
const root = resolve(legacy ? '.scratch/astro-svelte-migration/baseline/site' : 'dist');
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: unknown[] = [];
const errors: string[] = [];
const report: Record<string, unknown> = {
  replay,
  legacy,
  browser: browser.version(),
  results,
  errors,
};
async function files(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((item) =>
        item.isDirectory() ? files(join(dir, item.name)) : [join(dir, item.name)],
      ),
    )
  ).flat();
}
try {
  const manifest = Object.fromEntries(
    await Promise.all(
      (await files(root)).map(async (file) => [
        relative(root, file),
        createHash('sha256')
          .update(await readFile(file))
          .digest('hex'),
      ]),
    ),
  );
  report.artifact = manifest;
  if (!replay) {
    const context = await browser.newContext();
    try {
      for (const [path, hash] of Object.entries(manifest)) {
        const response = await context.request.get(`${site}/${path}`);
        assert.equal(response.status(), 200, path);
        assert.equal(
          createHash('sha256')
            .update(await response.body())
            .digest('hex'),
          hash,
          `Wrong served artifact: ${path}`,
        );
      }
    } finally {
      await context.close();
    }
  }
  for (const mobile of [false, true])
    for (const mode of ['normal', 'reduced', 'no-js']) {
      const name = `${mobile ? 'mobile' : 'desktop'}-${mode}`;
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        javaScriptEnabled: mode !== 'no-js',
        reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
      });
      try {
        if (replay)
          await context.route(`${site}/**`, async (route) => {
            const path = decodeURIComponent(new URL(route.request().url()).pathname);
            const file = resolve(root, '.' + path, ...(path.endsWith('/') ? ['index.html'] : []));
            if (!file.startsWith(root + '/')) return route.abort();
            try {
              const contentType = file.endsWith('.html')
                ? 'text/html; charset=utf-8'
                : file.endsWith('.js')
                  ? 'text/javascript'
                  : file.endsWith('.css')
                    ? 'text/css'
                    : file.endsWith('.svg')
                      ? 'image/svg+xml'
                      : file.endsWith('.jpg')
                        ? 'image/jpeg'
                        : file.endsWith('.png')
                          ? 'image/png'
                          : file.endsWith('.pdf')
                            ? 'application/pdf'
                            : 'application/octet-stream';
              await route.fulfill({ body: await readFile(file), contentType });
            } catch {
              await route.fulfill({ status: 404, body: 'Not found' });
            }
          });
        const page = await context.newPage();
        const network: unknown[] = [];
        page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(`${name}: ${message.text()}`);
        });
        page.on('requestfailed', (request) =>
          network.push({ url: request.url(), failure: request.failure() }),
        );
        results.push({ name, network });
        await page.goto(`${site}${legacy ? '/html/presse.html' : '/presse/'}`, {
          waitUntil: 'networkidle',
        });
        if (!legacy && mode !== 'no-js')
          await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
        await page
          .locator('img[loading="lazy"]')
          .evaluateAll((images) =>
            images.forEach((image) => image.setAttribute('loading', 'eager')),
          );
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((image) => image.decode()));
        });
        const cards = page.locator(legacy ? '.content a.article' : '.resource-card a');
        assert.equal(await cards.count(), 14);
        await page.screenshot({ path: join(output, `${name}-top.png`) });
        await page.screenshot({ path: join(output, `${name}-full.png`), fullPage: true });
        await cards.first().scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(output, `${name}-resources.png`) });
        if (legacy) continue;
        assert.equal(await page.locator('html').getAttribute('lang'), 'de');
        assert.equal(
          await page.locator('link[rel="canonical"]').getAttribute('href'),
          'https://susanne-preiss.de/presse/',
        );
        assert.equal(await page.locator('[hreflang="en"]').count(), 0);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
        );
        for (const href of await cards.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('href')!),
        )) {
          const response = await page.evaluate(async (href) => {
            const response = await fetch(href);
            return { status: response.status, prefix: (await response.text()).slice(0, 5) };
          }, href);
          assert.equal(response.status, 200);
          assert.equal(response.prefix, '%PDF-');
        }
        await cards.first().focus();
        await page.keyboard.press('Tab');
        assert.equal(await cards.nth(1).evaluate((node) => node === document.activeElement), true);
        if (mode === 'reduced')
          assert.equal(
            await cards
              .first()
              .locator('.resource-arrow')
              .evaluate((node) => getComputedStyle(node).transitionDuration),
            '0s',
          );
        const popupPromise = context.waitForEvent('page');
        await cards.first().click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        assert.match(popup.url(), /\/pdf\/badisches_tagesblatt.pdf$/);
        await popup.close();
        for (const slug of ['kontakt', 'impressum', 'datenschutz']) {
          await page.locator(`.site-footer a[href="/${slug}/"]`).click();
          await page.waitForURL(`**/${slug}/`);
          // Check ordinary direct entry without JS; enhanced return uses the shared close link.
          if (mode === 'no-js') await page.goto(`${site}/presse/`, { waitUntil: 'networkidle' });
          else await page.locator('#page-return').click();
          await page.waitForURL('**/presse/');
          if (mode !== 'no-js')
            await page.waitForFunction(
              () =>
                !document.documentElement.dataset.routePhase &&
                !document.querySelector('astro-island[ssr]'),
            );
        }
      } finally {
        await context.close();
      }
    }
  if (!legacy) assert.deepEqual(errors, []);
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
