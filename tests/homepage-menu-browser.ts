import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const output = process.argv[2];
if (!output) throw new Error('Usage: tsx tests/homepage-menu-browser.ts <new evidence directory>');
await mkdir(output, { recursive: false });
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: unknown[] = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  });
  try {
    const site = 'http://127.0.0.1:4321';
    await context.route(`${site}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      const file = resolve('dist', `.${path}`, ...(path.endsWith('/') ? ['index.html'] : []));
      assert.ok(file.startsWith(resolve('dist') + '/'));
      await route.fulfill({ path: file });
    });
    const page = await context.newPage();
    await page.goto(site, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.documentElement.dataset.homeSection !== undefined);
    // Ordinary tile and intro, twice each to catch stale GSAP transform caches on reopen.
    for (const index of [1, 0]) {
      const section = page.locator('.home-section').nth(index);
      await section.evaluate((node) =>
        node.scrollIntoView({ block: 'start', behavior: 'instant' }),
      );
      await page.waitForFunction(
        (index) =>
          document.documentElement.dataset.homeSection ===
          document.querySelectorAll<HTMLElement>('.home-section')[index]!.dataset.homeSection,
        index,
      );
      await page.keyboard.press('Tab');
      await page.locator('#menu-trigger').evaluate((node) => node.focus({ preventScroll: true }));
      await page.waitForTimeout(400);
      for (let repetition = 0; repetition < 2; repetition++) {
        const frames = await section.evaluate(async (node) => {
          const copy = node.querySelector<HTMLElement>('.home-copy')!;
          const image = node.querySelector<HTMLElement>('.home-image')!;
          const otherImages = [...document.querySelectorAll('.home-image')].filter(
            (image) => !node.contains(image),
          );
          const [sample] = [
            () => ({
              time: performance.now(),
              textTop: copy.firstElementChild!.getBoundingClientRect().top,
              imageTop: image.getBoundingClientRect().top,
              opacity: Number(getComputedStyle(copy).opacity),
              transform: getComputedStyle(copy).transform,
              translate: getComputedStyle(copy).translate,
              otherImages: otherImages.map((image) => image.getBoundingClientRect().top),
            }),
          ];
          const frames = [sample!()];
          document.getElementById('menu-trigger')!.click();
          const start = performance.now();
          while (performance.now() - start < 800) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            frames.push(sample!());
          }
          return frames;
        });
        results.push({ index, repetition, frames });
        const initial = frames[0]!;
        for (const [index, frame] of frames.slice(1).entries()) {
          assert.ok(
            frame.textTop >= frames[index]!.textTop - 1,
            'text reverses upward while opening',
          );
          assert.ok(
            frame.textTop - initial.textTop <= (1 - frame.opacity) * 844 + 2,
            'text jumps ahead of the menu animation at its start',
          );
          assert.ok(
            frame.textTop >= initial.textTop - 1,
            `text jumps upward by ${initial.textTop - frame.textTop}px`,
          );
          assert.ok(frame.imageTop <= initial.imageTop + 1, 'image only moves upward');
          for (const [index, top] of frame.otherImages.entries())
            assert.ok(
              Math.abs(top - initial.otherImages[index]!) < 1,
              'off-screen images remain stationary',
            );
        }
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('dialog[open]'));
        const restored = await section.evaluate(
          (node) =>
            node.querySelector('.home-copy')!.firstElementChild!.getBoundingClientRect().top,
        );
        assert.ok(
          Math.abs(restored - initial.textTop) < 1,
          'closing restores the original text position',
        );
      }
    }
  } finally {
    await context.close();
  }
} finally {
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify({ browser: browser.version(), results }, null, 2),
  );
  await browser.close();
}
