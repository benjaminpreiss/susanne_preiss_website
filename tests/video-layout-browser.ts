import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const output = process.argv[2];
if (!output) throw new Error('Supply a new capture directory');
await mkdir(output, { recursive: false });
const root = resolve(process.env.TEST_BUILD ?? 'dist');
const replay = process.env.TEST_LOCAL_BUILD === '1';
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: unknown[] = [];
const stackingFailures: string[] = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
    });
    try {
      if (replay)
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
      const page = await context.newPage();
      await page.goto(`${site}/workshops/`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      const section = page.locator('#video1');
      await section.scrollIntoViewIfNeeded();
      await section.locator('.video-play').click();
      await page.waitForFunction(
        () => (document.querySelector('hlsjs-video')?.currentTime ?? 0) > 0.5,
      );
      await section.locator('hlsjs-video').focus();
      await section.locator('video-compat-skin').hover();
      const frame = await section.locator('.video-frame').boundingBox();
      const skin = await section.locator('video-compat-skin').boundingBox();
      const container = await section.locator('media-container').boundingBox();
      const video = await section.locator('video').boundingBox();
      const controls = await section.locator('media-controls-content').boundingBox();
      const styles = await section
        .locator('video-compat-skin, media-container, hlsjs-video, video')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const style = getComputedStyle(node);
            return {
              tag: node.tagName,
              height: style.height,
              minHeight: style.minHeight,
              display: style.display,
              aspectRatio: style.aspectRatio,
              objectFit: style.objectFit,
            };
          }),
        );
      results.push({ mobile, frame, skin, container, video, controls, styles });
      await page.screenshot({ path: join(output, `${mobile ? 'mobile' : 'desktop'}.png`) });
      assert.ok(frame && skin && container && video && controls);
      assert.ok(
        Math.abs(container.height - frame.height) < 2,
        `Player container must match visible frame: ${JSON.stringify({ frame, container })}`,
      );
      assert.ok(
        Math.abs(video.y + video.height / 2 - frame.y - frame.height / 2) < 2,
        'Video must be vertically centered',
      );
      assert.ok(
        controls.y >= frame.y && controls.y + controls.height <= frame.y + frame.height + 2,
        'Controls must fit inside visible frame',
      );
      assert.ok(
        controls.y + controls.height < (mobile ? 664 : 900) - 70,
        'Controls must not be obscured by the site footer',
      );
      await section.locator('video').evaluate((media: HTMLVideoElement) => media.pause());
      for (const selector of ['#footer-contact', '#menu-trigger']) {
        const target = page.locator(selector);
        const nav = await target.boundingBox();
        const button = await section.locator('media-controls-content').boundingBox();
        assert.ok(nav && button);
        await page.evaluate(
          (delta) => window.scrollBy({ top: delta, behavior: 'instant' }),
          button.y + button.height / 2 - nav.y - nav.height / 2,
        );
        await page.waitForTimeout(300);
        const overlapped = await section.locator('media-controls-content').boundingBox();
        assert.ok(
          overlapped && Math.abs(overlapped.y + overlapped.height / 2 - nav.y - nav.height / 2) < 2,
          'Test must actually overlap the controls with navigation',
        );
        const layering = await target.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const surface = node.closest<HTMLElement>('header, footer')!;
          // Header background normally ignores pointer events. Temporarily enable only
          // hit-testing (not painting) to measure stacking across its empty centre too.
          const previous = surface.style.pointerEvents;
          surface.style.pointerEvents = 'auto';
          try {
            const hits = [rect.x + rect.width / 2, window.innerWidth / 2].map((x) =>
              document.elementFromPoint(x, rect.y + rect.height / 2),
            );
            return {
              visible: hits.every((hit) => hit === surface || surface.contains(hit)),
              hits: hits.map((hit) => hit?.tagName),
            };
          } finally {
            surface.style.pointerEvents = previous;
          }
        });
        results.push({ mobile, selector, layering });
        await page.screenshot({
          path: join(output, `${mobile ? 'mobile' : 'desktop'}-${selector.slice(1)}-paused.png`),
        });
        if (!layering.visible)
          stackingFailures.push(
            `${mobile ? 'mobile' : 'desktop'} ${selector}: ${JSON.stringify(layering)}`,
          );
      }
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(
    stackingFailures,
    [],
    'Navigation must remain above paused player controls when scrolling',
  );
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify({ replay, results }, null, 2));
  await browser.close();
}
