import { chromium, type BrowserContext } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { HlsJsVideoElement } from '@videojs/html/media/hlsjs-video';
const output = process.argv[2];
if (!output) throw new Error('Supply a new output directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const root = resolve('dist');
const replayEnabled = process.env.TEST_LOCAL_BUILD === '1';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: unknown[] = [];
const errors: string[] = [];
async function replay(context: BrowserContext) {
  if (!replayEnabled) return;
  await context.route(`${site}/**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = resolve(root, '.' + path, ...(path.endsWith('/') ? ['index.html'] : []));
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
}
try {
  const broken = await browser.newContext();
  try {
    await replay(broken);
    let inject = true;
    await broken.route('https://vod-cdn.lp-playback.studio/**', async (route) => {
      if (inject)
        await route.fulfill({
          contentType: 'application/vnd.apple.mpegurl',
          body: 'Not a valid HLS manifest',
        });
      else await route.continue();
    });
    const page = await broken.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${site}/workshops/`, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#video1');
    await section.scrollIntoViewIfNeeded();
    await section.locator('hlsjs-video').waitFor({ state: 'attached' });
    await section.locator('.video-play').waitFor();
    await page.waitForFunction(() => !!document.querySelector('.video-status')?.textContent);
    assert.equal(await section.locator('.media-player[data-started]').count(), 0);
    assert.match(await section.locator('.video-status').innerText(), /nicht abgespielt/);
    assert.equal(await section.locator('a[href*=".m3u8"]').count(), 0);
    await section.scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, 'injected-media-failure.png') });
    results.push({
      beforeRetry: await page.evaluate(() => ({
        target: !!document.querySelector('video-player')?.store.target,
        error: document.querySelector('hlsjs-video')?.error,
        storeError: document.querySelector('video-player')?.store.error,
      })),
    });
    inject = false;
    await section.locator('.video-play').click();
    await page.waitForTimeout(300);
    results.push({
      afterRetry: await page.evaluate(() => ({
        target: !!document.querySelector('video-player')?.store.target,
        error: document.querySelector('hlsjs-video')?.error,
        storeError: document.querySelector('video-player')?.store.error,
        started: document.querySelector('.media-player')?.getAttribute('data-started'),
        paused: document.querySelector('hlsjs-video')?.paused,
        readyState: document.querySelector('hlsjs-video')?.readyState,
      })),
    });
    await page.waitForFunction(
      () => (document.querySelector('hlsjs-video')?.currentTime ?? 0) > 1,
      undefined,
      { timeout: 15000 },
    );
    assert.equal(await section.locator('.video-status').innerText(), '');
    results.push({
      scenario:
        'Malformed manifest, visible localized error without raw playlist link, retry after source recovers',
      status: 'passed',
    });
  } finally {
    await broken.close();
  }

  const pending = await browser.newContext();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await replay(pending);
    await pending.route('https://vod-cdn.lp-playback.studio/**', async (route) => {
      await gate;
      await route.abort();
    });
    const page = await pending.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${site}/workshops/`, { waitUntil: 'domcontentloaded' });
    const video = page.locator('#video1 hlsjs-video');
    await page.locator('#video1 .video-play').click();
    const old = await video.elementHandle();
    assert.ok(old);
    await page.locator('.site-footer a[href="/kontakt/"]').click();
    await page.waitForURL('**/kontakt/');
    await page.waitForFunction(() => !document.documentElement.dataset.routePhase);
    release();
    await page.waitForTimeout(300);
    const disposed = await old.evaluate((node: HlsJsVideoElement) => ({
      connected: node.isConnected,
      engineDestroyed: node.engine === null,
    }));
    assert.deepEqual(disposed, { connected: false, engineDestroyed: true });
    assert.equal(await page.locator('hlsjs-video, video-player, .video-play').count(), 0);
    assert.equal(await page.locator('#page-return').count(), 1);
    results.push({
      scenario: 'Navigate away while play promise and HLS request are pending',
      disposed,
      status: 'passed',
    });
    await old.dispose();
  } finally {
    release();
    await pending.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify(
      { replay: replayEnabled, site, injectedFailures: true, results, errors },
      null,
      2,
    ),
  );
  await browser.close();
}
