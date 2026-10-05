import { chromium, type BrowserContext, type Page } from 'playwright';
import type { HlsJsVideoElement } from '@videojs/html/media/hlsjs-video';
import type { VideoPlayerElement } from '@videojs/html/video';
type MediaElement = HTMLVideoElement | HlsJsVideoElement;
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';

const output = process.argv[2];
if (!output) throw new Error('Supply a NEW output directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const replay = process.env.TEST_LOCAL_BUILD === '1';
const fixture = !!process.env.TEST_BUILD;
const legacy = process.env.TEST_LEGACY === '1';
const root = resolve(
  process.env.TEST_BUILD ?? (legacy ? '.scratch/astro-svelte-migration/baseline/site' : 'dist'),
);
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: Record<string, unknown>[] = [];
const errors: string[] = [];
const report: Record<string, unknown> = {
  date: new Date().toISOString(),
  replay,
  fixture,
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
                : file.endsWith('.vtt')
                  ? 'text/vtt'
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
  });
}
const placements = [
  { slug: 'workshops', file: 'workshops', id: 'video1' },
  { slug: 'personalentwicklung', file: 'personal', id: 'video2' },
  { slug: 'personalentwicklung', file: 'personal', id: 'video3' },
  { slug: 'regenerative-changemaker', file: 'changemaker', id: 'video3' },
];
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
  for (const mode of ['desktop', 'mobile', 'reduced']) {
    const context = await browser.newContext({
      viewport: mode === 'mobile' ? { width: 390, height: 664 } : { width: 1440, height: 900 },
      isMobile: mode === 'mobile',
      hasTouch: mode === 'mobile',
      reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
      locale: 'en-US',
    });
    try {
      await installReplay(context);
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(`${mode}: ${error.message}`));
      const scenarios = fixture
        ? [{ slug: 'about-susanne', file: '', id: 'english-placement' }]
        : mode === 'desktop'
          ? placements
          : [placements[0]!, placements[3]!];
      for (const placement of scenarios) {
        const { slug, file, id } = placement;
        const name = `${mode}-${slug}-${id}`;
        const network: unknown[] = [];
        const result: Record<string, unknown> = { name, network };
        results.push(result);
        const recordFailure = (request: import('playwright').Request) =>
          network.push({ url: request.url(), failure: request.failure() });
        const recordResponse = (response: import('playwright').Response) => {
          if (
            !response.url().startsWith(site) &&
            (response.url().includes('lp-playback') || response.status() >= 400)
          )
            network.push({ url: response.url(), status: response.status() });
        };
        page.on('requestfailed', recordFailure);
        page.on('response', recordResponse);
        try {
          await page.goto(`${site}${legacy ? `/html/${file}.html` : `/${slug}/`}`, {
            waitUntil: 'domcontentloaded',
          });
          if (!legacy) await settled(page);
          const section = page.locator(legacy ? `.m-video-container:has(#${id})` : `#${id}`);
          const video = section.locator(legacy ? 'video' : 'hlsjs-video');
          await section.scrollIntoViewIfNeeded();
          await section
            .locator('.video-initial-poster, .video-cover-image')
            .evaluateAll(async (nodes) => {
              await Promise.all(nodes.map((node) => (node as HTMLImageElement).decode()));
            });
          result.support = await video.evaluate((node: HTMLVideoElement) => ({
            mp4: node.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),
            hls: node.canPlayType('application/vnd.apple.mpegurl'),
            mediaSource: typeof MediaSource !== 'undefined',
            error: node.error && { code: node.error.code, message: node.error.message },
            readyState: node.readyState,
            poster: node.poster,
            currentSrc: node.currentSrc,
          }));
          await page.screenshot({ path: join(output, `${name}-cover.png`) });
          assert.equal(await video.count(), 1, 'One live video per placement');
          if (!legacy) {
            assert.equal(await section.locator('a[href*=".m3u8"]').count(), 0);
            assert.equal(await section.locator('.video-no-script').isVisible(), false);
          }
          const button = section.locator(legacy ? '.m-play-button' : '.video-play');
          if (!legacy) {
            assert.equal(
              await button.getAttribute('aria-label'),
              `${fixture ? 'Play' : 'Abspielen'}: ${fixture ? 'English video' : await video.getAttribute('aria-label')}`,
            );
            if (mode === 'reduced')
              assert.equal(
                await section
                  .locator('.video-title')
                  .evaluate((node) => getComputedStyle(node).transitionDuration),
                '0s',
              );
          }
          if (!legacy)
            await button.evaluate((node) => {
              node.addEventListener(
                'click',
                async () => {
                  const section = node.closest('.editorial-video')!;
                  const title = section.querySelector('.video-title')!;
                  const samples: { time: number; x: number; width: number }[] = [];
                  const start = performance.now();
                  while (performance.now() - start < 350) {
                    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
                    const transform = getComputedStyle(title).transform;
                    samples.push({
                      time: performance.now() - start,
                      x: transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41,
                      width: title.getBoundingClientRect().width,
                    });
                    node.setAttribute('data-motion-samples', JSON.stringify(samples));
                  }
                },
                { once: true },
              );
            });
          await button.focus();
          await page.keyboard.press('Enter');
          // A resolved play() call or poster isn't playback evidence: require decoded dimensions and progress.
          await video.evaluate(
            (node) =>
              new Promise<void>((resolve, reject) => {
                const video = node as HTMLVideoElement;
                const timeout = setTimeout(() => {
                  clearInterval(interval);
                  reject(
                    new Error(
                      `No real progress: ${JSON.stringify({ time: video.currentTime, paused: video.paused, readyState: video.readyState, error: video.error && { code: video.error.code, message: video.error.message } })}`,
                    ),
                  );
                }, 45000);
                const interval = setInterval(() => {
                  if (!video.paused && video.currentTime > 1.5 && video.videoWidth > 0) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    resolve();
                  }
                }, 100);
              }),
          );
          if (!legacy) {
            const motion: { time: number; x: number; width: number }[] = JSON.parse(
              (await button.getAttribute('data-motion-samples'))!,
            );
            result.motion = motion;
            const intermediate = motion.some(
              (sample) => Math.abs(sample.x) > 1 && Math.abs(sample.x) < sample.width - 1,
            );
            assert.equal(intermediate, mode !== 'reduced', 'Cover travel only under normal motion');
            const final = motion.at(-1)!;
            assert.ok(
              Math.abs(Math.abs(final.x) - final.width) < 1,
              'Cover moves fully out of the frame',
            );
            assert.equal(Math.sign(final.x), slug === 'regenerative-changemaker' ? 1 : -1);
          }
          result.play = await video.evaluate((node: HTMLVideoElement) => ({
            time: node.currentTime,
            duration: node.duration,
            width: node.videoWidth,
            height: node.videoHeight,
            paused: node.paused,
          }));
          await page.screenshot({ path: join(output, `${name}-playing.png`) });
          const pause = section
            .locator(legacy ? '.vjs-play-control' : 'media-play-button')
            .filter({ visible: true })
            .first();
          if (!legacy) assert.match((await pause.getAttribute('aria-label')) ?? '', /Pause/);
          await pause.focus();
          await page.keyboard.press('Space');
          assert.equal(await video.evaluate((node: HTMLVideoElement) => node.paused), true);
          const time = await video.evaluate((node: HTMLVideoElement) => node.currentTime);
          await page.waitForTimeout(600);
          assert.ok(
            Math.abs((await video.evaluate((node: HTMLVideoElement) => node.currentTime)) - time) <
              0.15,
          );
          result.pause = { time, stable: true };
          if (!legacy)
            assert.match(
              (await pause.getAttribute('aria-label')) ?? '',
              fixture ? /Play/ : /Wiedergabe|Abspielen/,
            );
          await section.locator(legacy ? '.vjs-mute-control' : 'media-mute-button').click();
          assert.equal(await video.evaluate((node: MediaElement) => node.muted), true);
          await section.locator(legacy ? '.vjs-mute-control' : 'media-mute-button').click();
          assert.equal(await video.evaluate((node: MediaElement) => node.muted), false);
          result.controls = await section
            .locator(
              legacy
                ? '.vjs-control-bar button, .vjs-control-bar [role="slider"]'
                : '[role="button"], [role="slider"]',
            )
            .evaluateAll((nodes) =>
              nodes.map((node) => ({
                title: node.getAttribute('title'),
                role: node.getAttribute('role'),
                label: node.getAttribute('aria-label'),
              })),
            );
          const fullscreen = section.locator(
            legacy ? '.vjs-fullscreen-control' : 'media-fullscreen-button',
          );
          assert.ok(await fullscreen.isVisible());
          if (!legacy) {
            const beforeSeek = await video.evaluate((node: MediaElement) => node.currentTime);
            await section.locator('media-time-slider').focus();
            await page.keyboard.press('ArrowRight');
            assert.ok(
              (await video.evaluate((node: MediaElement) => node.currentTime)) > beforeSeek,
            );
            result.keyboardSeek = true;
            await fullscreen.click();
            await page.waitForFunction(() => !!document.fullscreenElement);
            result.fullscreen = await page.evaluate(() => document.fullscreenElement?.tagName);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);
            result.fullscreenEscape = await page.evaluate(() => !document.fullscreenElement);
            // Headless CDP may not implement the browser's native Escape handling.
            if (!result.fullscreenEscape) await fullscreen.click();
            await page.waitForFunction(() => !document.fullscreenElement);
          }
          await pause.click();
          await page.waitForTimeout(600);
          assert.equal(await video.evaluate((node: HTMLVideoElement) => node.paused), false);
          // Seek near the end, then let real decoded media reach ended (not a synthetic event).
          await video.evaluate((node: HTMLVideoElement) => {
            node.currentTime = Math.max(0, node.duration - 1.5);
          });
          await page.waitForFunction(
            (id) => {
              const video = document.querySelector<MediaElement>(
                `#${id} hlsjs-video, video#${id}_html5_api`,
              );
              return video?.ended;
            },
            id,
            { timeout: 30000 },
          );
          if (!legacy) {
            assert.equal(await section.locator('.media-player[data-started]').count(), 0);
            assert.equal(await button.isEnabled(), true);
          }
          result.end = 'Actual ended after seek near duration';
          await page.screenshot({ path: join(output, `${name}-ended.png`) });
          await button.click();
          await page.waitForFunction(
            (id) => {
              const video = document.querySelector<MediaElement>(
                `#${id} hlsjs-video, video#${id}_html5_api`,
              );
              return (
                video &&
                !video.paused &&
                video.currentTime > 0.5 &&
                video.currentTime < video.duration - 2
              );
            },
            id,
            { timeout: 30000 },
          );
          result.replay = 'Progress after replay';
          if (!legacy) {
            if (fixture) {
              assert.equal(
                await video.getAttribute('lang'),
                'de',
                'English controls do not relabel the German media',
              );
              const tracks = await video.evaluate((node: HTMLVideoElement) =>
                Array.from(node.textTracks).map((track) => ({
                  language: track.language,
                  label: track.label,
                })),
              );
              assert.ok(
                tracks.some(
                  (track) => track.language === 'en' && track.label === 'Fixture English',
                ),
              );
              assert.equal(
                await section.locator('.media-transcript').getAttribute('href'),
                '/contact/',
              );
              result.captionTracks = tracks;
              await section
                .locator('video-player')
                .evaluate((node: VideoPlayerElement) => node.store.toggleSubtitles(true));
              await page.waitForFunction(() =>
                Array.from(document.querySelector('hlsjs-video')?.textTracks ?? []).some(
                  (track) => track.mode === 'showing' && (track.cues?.length ?? 0) > 0,
                ),
              );
              result.captionCuesLoaded = true;
            }
            const oldVideo = await video.elementHandle();
            const utility = fixture ? '/contact/' : '/kontakt/';
            await page.locator(`.site-footer a[href="${utility}"]`).click();
            await page.waitForURL(`**${utility}`);
            await settled(page);
            assert.ok(oldVideo);
            result.disposed = await oldVideo.evaluate((node: HlsJsVideoElement) => ({
              connected: node.isConnected,
              paused: node.paused,
              engineDestroyed: node.engine === null,
            }));
            assert.equal((result.disposed as { connected: boolean }).connected, false);
            assert.equal((result.disposed as { paused: boolean }).paused, true);
            assert.equal((result.disposed as { engineDestroyed: boolean }).engineDestroyed, true);
            await page.locator('#page-return').click();
            await page.waitForURL(`**/${slug}/`);
            await settled(page);
            assert.equal(await section.locator('video').count(), 1);
            assert.equal(await section.locator('video-player').count(), 1);
            await oldVideo.dispose();
          }
          result.status = 'passed';
        } catch (error) {
          result.failure = String(error);
          throw error;
        } finally {
          page.off('requestfailed', recordFailure);
          page.off('response', recordResponse);
        }
      }
    } finally {
      await context.close();
    }
  }
  if (!legacy) {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      await installReplay(context);
      const page = await context.newPage();
      await page.goto(`${site}/${fixture ? 'about-susanne' : 'workshops'}/`, {
        waitUntil: 'domcontentloaded',
      });
      const section = page.locator(fixture ? '#english-placement' : '#video1');
      assert.equal(await section.locator('.native-video[controls]').count(), 1);
      assert.equal(await section.locator('a[href*=".m3u8"], .video-play, hlsjs-video').count(), 0);
      assert.match(
        await section.locator('.video-no-script').innerText(),
        fixture ? /Enable JavaScript/ : /Aktivieren Sie JavaScript/,
      );
      report.noJavaScript = 'Native video and localized guidance; no raw streaming-playlist link';
    } finally {
      await context.close();
    }
    assert.deepEqual(errors, []);
  }
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
