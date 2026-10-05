import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import sharp from 'sharp';

const output = resolve(process.argv[2] ?? '.scratch/ticket13/image-sizing');
await mkdir(output, { recursive: true });
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const context = await browser.newContext({
  viewport: { width: 1319, height: 955 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
});
const site = 'http://image-sizing.test';
const errors: string[] = [];
try {
  await context.route(`${site}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const file = resolve('dist', '.' + path, ...(path.endsWith('/') ? ['index.html'] : []));
    assert.ok(file.startsWith(resolve('dist') + '/'));
    const types: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.avif': 'image/avif',
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
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
  await page.goto(site, { waitUntil: 'networkidle' });
  await page
    .locator('#section-changemaker')
    .evaluate((section) => section.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const image = page.locator('#section-changemaker .home-image img');
  await image.evaluate((node) => (node as HTMLImageElement).decode());
  const selected = await image.evaluate((node) => {
    const image = node as HTMLImageElement;
    const box = image.getBoundingClientRect();
    return {
      src: new URL(image.currentSrc).pathname,
      width: box.width,
      height: box.height,
      dpr: devicePixelRatio,
      sizes: image.sizes,
    };
  });
  const bytes = await readFile(resolve('dist', '.' + selected.src));
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.width, Number(process.env.EXPECTED_IMAGE_WIDTH ?? 1440));
  if (!process.env.EXPECTED_IMAGE_WIDTH)
    assert.ok(bytes.length < 300_000, `Portrait budget exceeded: ${bytes.length}`);
  await page.screenshot({ path: `${output}/portrait.png` });
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        mode: 'built-file replay',
        selected,
        intrinsic: { width: metadata.width, height: metadata.height },
        bytes: bytes.length,
        errors,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
} finally {
  await context.close();
  await browser.close();
}
