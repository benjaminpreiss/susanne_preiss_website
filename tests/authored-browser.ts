import { chromium, type Page, type BrowserContext } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';

const output = process.argv[2];
if (!output) throw new Error('Supply a new evidence directory');
await mkdir(output, { recursive: false });
const replay = process.env.TEST_LOCAL_BUILD === '1';
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const fixtureSite = process.env.TEST_FIXTURE_SITE ?? 'http://127.0.0.1:4322';
const fixture = process.env.AUTHORED_FIXTURE_OUTPUT;
if (!fixture)
  throw new Error('AUTHORED_FIXTURE_OUTPUT must identify the isolated bilingual artifact');
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const errors: string[] = [];
const results: unknown[] = [];
const artifacts: Record<string, Record<string, string>> = {};
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
async function files(root: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(root, { withFileTypes: true })).map((entry) =>
        entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)],
      ),
    )
  ).flat();
}
async function prepare(context: BrowserContext, origin: string, root: string) {
  if (replay)
    await context.route(`${origin}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      const file = resolve(root, `.${path}`, ...(path.endsWith('/') ? ['index.html'] : []));
      if (!file.startsWith(resolve(root) + '/')) return route.abort();
      try {
        await route.fulfill({ path: file });
      } catch {
        await route.fulfill({ status: 404, body: 'Missing artifact' });
      }
    });
}
async function settled(page: Page, path: string, javascript = true) {
  await page.waitForURL((url) => url.pathname === path);
  if (javascript)
    await page.waitForFunction(
      () =>
        !document.documentElement.dataset.routePhase &&
        !document.querySelector('astro-island[ssr]'),
    );
  assert.equal(await page.evaluate(() => document.body.style.position), '');
}
try {
  for (const [origin, root] of [
    [site, resolve('dist')],
    [fixtureSite, resolve(fixture)],
  ]) {
    const manifest: Record<string, string> = {};
    const context = await browser.newContext();
    try {
      await prepare(context, origin!, root!);
      const page = await context.newPage();
      await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
      for (const file of await files(root!)) {
        const name = relative(root!, file);
        const expected = hash(await readFile(file));
        if (!replay) {
          const bytes = await page.evaluate(async (url) => {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
            return [...new Uint8Array(await response.arrayBuffer())];
          }, `${origin}/${name}`);
          assert.equal(hash(Buffer.from(bytes)), expected, `Served artifact mismatch: ${name}`);
        }
        manifest[name] = expected;
      }
      artifacts[origin!] = manifest;
    } finally {
      await context.close();
    }
  }
  for (const mobile of [false, true])
    for (const mode of ['normal', 'reduce', 'no-js', 'no-native'] as const) {
      const javascript = mode !== 'no-js';
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        javaScriptEnabled: javascript,
        reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference',
      });
      try {
        await prepare(context, site, resolve('dist'));
        await prepare(context, fixtureSite, resolve(fixture));
        if (mode === 'no-native')
          await context.addInitScript(() =>
            Object.defineProperty(document, 'startViewTransition', {
              configurable: true,
              value: undefined,
            }),
          );
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(`${mobile}/${mode}: ${error.message}`));
        page.on('response', (response) => {
          if (
            (response.url().startsWith(site) || response.url().startsWith(fixtureSite)) &&
            response.status() >= 400
          )
            errors.push(`${response.status()} ${response.url()}`);
        });
        await page.goto(`${fixtureSite}/contact/`, { waitUntil: 'networkidle' });
        await settled(page, '/contact/', javascript);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        assert.equal(await page.locator('#page-return').textContent(), 'Close');
        assert.equal(
          await page.locator('link[rel="canonical"]').getAttribute('href'),
          'https://susanne-preiss.de/contact/',
        );
        await page.locator('nav[aria-label="Language"] a').click();
        await settled(page, '/kontakt/', javascript);
        assert.equal(await page.locator('html').getAttribute('lang'), 'de');
        await page.locator('nav[aria-label="Sprache"] a').click();
        await settled(page, '/contact/', javascript);
        // Direct English utility entry returns to its authored English home, not German root.
        await page.goto(`${fixtureSite}/contact/`, { waitUntil: 'networkidle' });
        await page.locator('#page-return').click();
        await settled(page, '/en/', javascript);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        for (const path of ['/legal/privacy-policy/', '/en/regenerative-changemaker/']) {
          await page.goto(`${fixtureSite}${path}`, { waitUntil: 'networkidle' });
          await settled(page, path, javascript);
          assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        }
        if (javascript) {
          assert.match(
            (await page.locator('.video-play').getAttribute('aria-label')) ?? '',
            /^Play:/,
          );
          // An English page can link to a prefixed or unprefixed English utility.
          await page.locator('#footer-contact').click();
          await settled(page, '/contact/');
          await page.locator('#page-return').click();
          await settled(page, '/en/regenerative-changemaker/');
          await page.goForward({ waitUntil: 'commit' });
          await settled(page, '/contact/');
          await page.goBack({ waitUntil: 'commit' });
          await settled(page, '/en/regenerative-changemaker/');
        }
        await page.goto(`${site}/index.html#regenerativeFrameWork`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('.home-section').count(), 8);
        assert.equal(new URL(page.url()).pathname, '/index.html');
        assert.equal(new URL(page.url()).hash, '#regenerativeFrameWork');
        assert.equal(
          await page.locator('link[rel="canonical"]').getAttribute('href'),
          'https://susanne-preiss.de/',
        );
        for (const alias of ['/de/personalentwicklung/#video2', '/html/personal.html#video2']) {
          await page.goto(`${site}${alias}`, { waitUntil: 'networkidle' });
          await settled(page, '/personalentwicklung/', javascript);
          if (javascript) assert.equal(new URL(page.url()).hash, '#video2');
          assert.equal(await page.locator('#video2').count(), 1);
        }
        await page.goto(`${site}/kontakt/`, { waitUntil: 'networkidle' });
        await page.locator('#page-return').click();
        await settled(page, '/', javascript);
        assert.equal(await page.locator('[hreflang="en"]').count(), 0);
        await page.screenshot({
          path: join(output, `${mobile ? 'mobile' : 'desktop'}-${mode}.png`),
        });
        results.push({ mobile, mode, mixedLanguagePaths: true, rootDocument: true, aliases: true });
      } finally {
        await context.close();
      }
    }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify(
      {
        replay,
        artifacts,
        results,
        errors,
        browser: browser.version(),
        date: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  await browser.close();
}
