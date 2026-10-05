import { chromium, type Page, type BrowserContext } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';

const output = process.argv[2];
if (!output) throw new Error('Supply a NEW capture directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const replay = process.env.TEST_LOCAL_BUILD === '1';
const root = resolve('dist');
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const errors: string[] = [];
const results: unknown[] = [];
const report: Record<string, unknown> = {
  date: new Date().toISOString(),
  replay,
  browser: browser.version(),
  results,
  errors,
};
const pages = [
  'personalentwicklung',
  'business-coaching',
  'top-management-sparring',
  'key-note-speaker',
];
async function files(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((item) =>
        item.isDirectory() ? files(join(dir, item.name)) : [join(dir, item.name)],
      ),
    )
  ).flat();
}
async function installReplay(context: BrowserContext) {
  if (!replay) return;
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
                  : 'application/octet-stream';
      await route.fulfill({ body: await readFile(file), contentType });
    } catch {
      await route.fulfill({ status: 404, body: 'Not found' });
    }
  });
}
async function settled(page: Page) {
  await page.waitForFunction(
    () =>
      !document.documentElement.dataset.routePhase && !document.querySelector('astro-island[ssr]'),
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  assert.equal(await page.evaluate(() => document.body.style.position), '');
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
      for (const [path, expected] of Object.entries(manifest)) {
        const response = await context.request.get(`${site}/${path}`);
        assert.equal(response.status(), 200, path);
        assert.equal(
          createHash('sha256')
            .update(await response.body())
            .digest('hex'),
          expected,
          `Wrong served artifact: ${path}`,
        );
      }
    } finally {
      await context.close();
    }
  }
  for (const mobile of [false, true])
    for (const reduced of [false, true]) {
      const name = `${mobile ? 'mobile' : 'desktop'}-${reduced ? 'reduced' : 'normal'}`;
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
        deviceScaleFactor: mobile ? 3 : 1,
        isMobile: mobile,
        hasTouch: mobile,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      });
      try {
        await installReplay(context);
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
        page.on('response', (response) => {
          if (response.url().startsWith(site) && response.status() >= 400)
            errors.push(`${response.status()} ${response.url()}`);
        });
        for (const slug of pages) {
          await page.goto(`${site}/${slug}/`, { waitUntil: 'networkidle' });
          await settled(page);
          assert.equal(await page.locator('html').getAttribute('lang'), 'de');
          assert.equal(await page.locator('main h1').count(), 1);
          assert.equal(await page.locator('[hreflang="en"]').count(), 0);
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
          );
          assert.equal(
            await page
              .locator('.site-header')
              .evaluate((node) => node.classList.contains('light-controls')),
            slug === 'business-coaching',
          );
          assert.equal(
            await page.evaluate(() =>
              ['Cormorant Garamond', 'Open Sans'].every((family) =>
                [...document.fonts].some(
                  (font) => font.family === family && font.status === 'loaded',
                ),
              ),
            ),
            true,
          );
          const footer = await page.locator('.site-footer').boundingBox();
          assert.ok(
            footer && footer.y >= 0 && footer.y + footer.height <= (mobile ? 664 : 900) + 1,
            JSON.stringify({ name, slug, footer }),
          );
          await page.screenshot({ path: join(output, `${name}-${slug}-top.png`) });
          await page.screenshot({ path: join(output, `${name}-${slug}.png`), fullPage: true });
          await page.evaluate(() => scrollTo(0, 650));
          await page.waitForTimeout(100);
          assert.equal(
            await page
              .locator('.site-header')
              .evaluate((node) => node.classList.contains('light-controls')),
            false,
          );
          const scroll = await page.evaluate(() => scrollY);
          for (const utility of ['kontakt', 'impressum', 'datenschutz']) {
            await page.locator(`.site-footer a[href="/${utility}/"]`).click();
            await page.waitForURL(`**/${utility}/`);
            await settled(page);
            assert.equal(await page.locator('.site-footer a').count(), 1);
            await page.locator('#page-return').click();
            await page.waitForURL(`**/${slug}/`);
            await settled(page);
            assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 3);
          }
          await page.locator('#menu-trigger').click();
          await page.locator('dialog[open]').waitFor();
          await page.waitForTimeout(reduced ? 50 : 1100);
          await page.evaluate(() => document.fonts.ready);
          assert.equal(
            await page.evaluate(() =>
              [...document.fonts].some(
                (font) => font.family === 'Roboto' && font.status === 'loaded',
              ),
            ),
            true,
          );
          await page.screenshot({ path: join(output, `${name}-${slug}-menu.png`) });
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => !document.querySelector('dialog[open]'));
          await settled(page);
          assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 3);
          const next = pages[(pages.indexOf(slug) + 1) % pages.length]!;
          await page.locator('#menu-trigger').click();
          await page.locator(`dialog[open] a[href="/${next}/"]`).click();
          await page.waitForURL(`**/${next}/`);
          await settled(page);
          await page.goBack();
          await settled(page);
          assert.equal(new URL(page.url()).pathname, `/${slug}/`);
          assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 3);
          results.push({ name, slug, scroll, status: 'passed' });
        }
        for (const id of ['video2', 'video3']) {
          await page.goto(`${site}/html/personal.html#${id}`, { waitUntil: 'networkidle' });
          await settled(page);
          assert.equal(new URL(page.url()).pathname, '/personalentwicklung/');
          assert.equal(new URL(page.url()).hash, `#${id}`);
          assert.equal(await page.locator(`#${id}`).count(), 1);
        }
      } finally {
        await context.close();
      }
    }
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  try {
    await installReplay(noScript);
    const page = await noScript.newPage();
    for (const [index, legacy] of ['personal', 'business', 'sparring', 'speaker'].entries()) {
      await page.goto(`${site}/html/${legacy}.html${legacy === 'personal' ? '#video2' : ''}`, {
        waitUntil: 'networkidle',
      });
      assert.equal(new URL(page.url()).pathname, `/${pages[index]}/`);
      assert.equal(await page.locator('main h1').count(), 1);
      assert.ok((await page.locator('.no-script-navigation a').count()) >= 4);
      if (legacy === 'personal') {
        report.noJavaScriptRedirectFragment = new URL(page.url()).hash;
        // Explicit meta-refresh destinations do not reliably inherit fragments.
        // Direct canonical fragment URLs remain usable without scripting.
        await page.goto(`${site}/personalentwicklung/#video2`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('#video2').count(), 1);
        assert.equal(new URL(page.url()).hash, '#video2');
      }
    }
    report.noJavaScript =
      'four redirects, content and navigation; direct canonical video2 fragment works; see redirect fragment limitation';
  } finally {
    await noScript.close();
  }
  assert.deepEqual(errors, []);
  report.result = 'passed';
} catch (error) {
  report.result = 'failed';
  report.failure = String(error);
  throw error;
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
