import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const destination = process.argv[2];
if (!destination) throw new Error('Usage: pnpm test:browser <NEW capture directory>');
const output = resolve(destination);
await mkdir(output, { recursive: false }); // Never replace reference captures.
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const sha256 = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');
async function files(path: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(path, { withFileTypes: true })).map((entry) =>
        entry.isDirectory() ? files(join(path, entry.name)) : [join(path, entry.name)],
      ),
    )
  ).flat();
}
const report: Record<string, unknown> = {
  date: new Date().toISOString(),
  browser: browser.version(),
  site,
  node: process.version,
};
const errors: string[] = [];
try {
  // Identify the exact served artifact before taking screenshots.
  const context = await browser.newContext();
  try {
    const hashes: Record<string, string> = {};
    for (const file of await files(resolve('dist'))) {
      const path = relative(resolve('dist'), file);
      const response = await context.request.get(`${site}/${path}`);
      assert.equal(response.status(), 200, path);
      const expected = sha256(await readFile(file));
      assert.equal(sha256(await response.body()), expected, `Wrong served artifact: ${path}`);
      hashes[path] = expected;
    }
    report.artifact = hashes;
  } finally {
    await context.close();
  }

  for (const device of [
    {
      name: 'desktop',
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
    {
      name: 'mobile',
      viewport: { width: 390, height: 664 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  ]) {
    const context = await browser.newContext({
      ...device,
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
    });
    try {
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(`${device.name}: ${error.message}`));
      page.on('requestfailed', (request) => {
        if (request.url().startsWith(site))
          errors.push(`${device.name}: ${request.url()}: ${request.failure()?.errorText}`);
      });
      page.on('response', (response) => {
        if (response.url().startsWith(site) && response.status() >= 400)
          errors.push(`${device.name}: ${response.status()} ${response.url()}`);
      });
      const response = await page.goto(`${site}/ueber-mich/`, { waitUntil: 'networkidle' });
      assert.equal(response?.status(), 200);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image) => image.decode()));
      });
      await page.waitForTimeout(1000);
      assert.equal(await page.locator('html').getAttribute('lang'), 'de');
      assert.equal(await page.title(), 'About Susanne Preiss');
      assert.equal(
        await page.locator('link[rel="canonical"]').getAttribute('href'),
        'https://susanne-preiss.de/ueber-mich/',
      );
      assert.equal(await page.locator('[hreflang="en"]').count(), 0);
      assert.deepEqual(
        await page
          .locator('article a')
          .evaluateAll((links) => links.map((link) => getComputedStyle(link).textDecorationLine)),
        ['none', 'none', 'none'],
      );
      assert.equal(
        await page.evaluate(() =>
          ['Cormorant Garamond', 'Open Sans'].every((family) =>
            Array.from(document.fonts).some(
              (font) => font.family === family && font.status === 'loaded',
            ),
          ),
        ),
        true,
      );
      await page.screenshot({
        path: join(output, `${device.name}-about.png`),
        animations: 'disabled',
      });
      await page.screenshot({
        path: join(output, `${device.name}-about-full.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await writeFile(join(output, `${device.name}-about.html`), await page.content());
      report[device.name] = await page.evaluate(() => ({
        fonts: Array.from(document.fonts).map((font) => ({
          family: font.family,
          status: font.status,
        })),
        images: Array.from(document.images).map((image) => ({
          src: image.currentSrc,
          complete: image.complete,
          width: image.naturalWidth,
        })),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        title: document.title,
      }));
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.goto(`${site}/html/about.html#about`, { waitUntil: 'networkidle' });
      assert.equal(new URL(page.url()).pathname, '/ueber-mich/');
      assert.equal(new URL(page.url()).hash, '#about');
      assert.equal(await page.locator('#about').count(), 1);
      await page.goto(`${site}/`, { waitUntil: 'networkidle' });
      assert.equal(new URL(page.url()).pathname, '/');
    } finally {
      await context.close();
    }
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await noScript.newPage();
    await page.goto(`${site}/html/about.html#about`, { waitUntil: 'networkidle' });
    assert.equal(new URL(page.url()).pathname, '/ueber-mich/');
    // Meta-refresh fragment inheritance is browser behavior, not an HTTP redirect guarantee.
    report.noJavaScriptFragment = new URL(page.url()).hash;
    report.noJavaScriptRedirect = 'passed';
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
  report.errors = errors;
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); // Disconnect CDP; do not issue raw Browser.close.
}
