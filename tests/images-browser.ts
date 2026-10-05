import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

// Focused asset verification. Replay is explicit; it is not HTTP-server verification.
const output = resolve(process.argv[2] ?? '.scratch/ticket13/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4344';
const replay = process.env.TEST_LOCAL_BUILD === '1';
const baseline = process.env.IMAGE_BASELINE;
const report: unknown[] = [];
const errors: string[] = [];
const fallbackSelections: unknown[] = [];
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    for (const javaScriptEnabled of [true, false]) {
      for (const path of [
        '/',
        '/ueber-mich/',
        '/workshops/',
        '/online-training/',
        '/regenerative-changemaker/',
        '/presse/',
      ]) {
        const samples: Record<string, Awaited<ReturnType<typeof capture>>> = {};
        async function capture(root: string, version: string) {
          const context = await browser.newContext({
            viewport,
            javaScriptEnabled,
            deviceScaleFactor: viewport.width < 500 ? 2 : 1,
            reducedMotion: 'reduce',
          });
          try {
            if (replay)
              await context.route(`${site}/**`, async (route) => {
                const pathname = new URL(route.request().url()).pathname;
                const file = resolve(
                  root,
                  `.${pathname}`,
                  ...(pathname.endsWith('/') ? ['index.html'] : []),
                );
                if (!file.startsWith(`${resolve(root)}/`)) return route.abort();
                const types: Record<string, string> = {
                  '.html': 'text/html',
                  '.js': 'text/javascript',
                  '.css': 'text/css',
                  '.jpg': 'image/jpeg',
                  '.JPG': 'image/jpeg',
                  '.png': 'image/png',
                  '.svg': 'image/svg+xml',
                  '.avif': 'image/avif',
                  '.webp': 'image/webp',
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
            page.on('response', (response) => {
              if (response.url().startsWith(site) && response.status() >= 400)
                errors.push(response.url());
            });
            await page.goto(site + path, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            await page.locator('main img[src]').evaluateAll(async (nodes) => {
              for (const node of nodes)
                if (node instanceof HTMLImageElement) {
                  node.loading = 'eager';
                  try {
                    await node.decode();
                  } catch {
                    throw new Error(`Cannot decode ${node.outerHTML}`);
                  }
                }
            });
            const images = await page.locator('main img[src]').evaluateAll((nodes) =>
              nodes.map((node) => {
                const img = node as HTMLImageElement;
                const box = img.getBoundingClientRect(),
                  css = getComputedStyle(img);
                const resource = performance.getEntriesByName(img.currentSrc).at(-1) as
                  | PerformanceResourceTiming
                  | undefined;
                return {
                  src: new URL(img.currentSrc).pathname,
                  alt: img.alt,
                  box: { x: box.x, y: box.y, width: box.width, height: box.height },
                  fit: css.objectFit,
                  position: css.objectPosition,
                  naturalWidth: img.naturalWidth,
                  encodedBodySize: resource?.encodedBodySize,
                };
              }),
            );
            const name = `${viewport.width}-${javaScriptEnabled ? 'js' : 'nojs'}-${path.replaceAll('/', '') || 'home'}-${version}`;
            await page.screenshot({ path: `${output}/${name}.png` });
            // Below-the-fold representative screenshot; all images were decoded above.
            if (path === '/workshops/') {
              await page.locator('.course-panel').first().scrollIntoViewIfNeeded();
              await page.screenshot({ path: `${output}/${name}-course.png` });
            }
            if (version === 'after' && javaScriptEnabled && path === '/ueber-mich/') {
              // Emulate unsupported source types without modifying the built artifact.
              for (const [disabled, expected] of [
                ['avif', '.webp'],
                ['webp', '.jpg'],
              ] as const) {
                await page
                  .locator(`.hero source[type="image/${disabled}"]`)
                  .evaluate((node) => node.setAttribute('type', 'image/unsupported-test'));
                await page.waitForFunction((extension) => {
                  const image = document.querySelector<HTMLImageElement>('.hero img');
                  return (
                    image?.complete &&
                    image.naturalWidth > 0 &&
                    image.currentSrc.endsWith(extension)
                  );
                }, expected);
                fallbackSelections.push({
                  viewport,
                  disabled,
                  selected: await page
                    .locator('.hero img')
                    .evaluate((node) => (node as HTMLImageElement).currentSrc),
                });
              }
            }
            return images;
          } finally {
            await context.close();
          }
        }
        if (baseline) samples.before = await capture(resolve(baseline), 'before');
        samples.after = await capture(resolve('dist'), 'after');
        if (path === '/')
          assert.match(
            samples.after[1]!.src,
            viewport.width < viewport.height ? /web_head_01\./ : /web_head_01_square\./,
          );
        const bytes = [];
        for (const [index, image] of samples.after.entries()) {
          assert.ok(image.naturalWidth > 0);
          if (image.src.startsWith('/_astro/') && !image.src.endsWith('.jpg'))
            assert.match(image.src, /\.avif$/);
          if (samples.before) {
            const original = samples.before[index];
            assert.ok(original);
            assert.equal(image.alt, original.alt);
            assert.deepEqual(image.box, original.box, `${path} image ${index} layout changed`);
            assert.equal(image.fit, original.fit);
            assert.equal(image.position, original.position);
            bytes.push({
              original: original.src,
              selected: image.src,
              before: (await readFile(resolve(baseline!, '.' + original.src))).length,
              after: (await readFile(resolve('dist', '.' + image.src))).length,
              encodedBodySize: image.encodedBodySize,
            });
          }
        }
        report.push({ viewport, javaScriptEnabled, path, samples, bytes });
      }
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    `${output}/report.json`,
    JSON.stringify({ replay, errors, fallbackSelections, report }, null, 2),
  );
  await browser.close();
}
