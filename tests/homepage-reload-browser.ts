import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const output = resolve(process.argv[2] ?? '.scratch/ticket13/homepage-reload');
await mkdir(output, { recursive: true });
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const report: unknown[] = [];
const errors: string[] = [];
const site = 'http://homepage-images.test';
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ])
    for (const observerAvailable of [true, false]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      if (!observerAvailable)
        await context.addInitScript(() => {
          Object.defineProperty(window, 'IntersectionObserver', { value: undefined });
        });
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
      try {
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(site, { waitUntil: 'networkidle' });
        await page.waitForFunction(
          () => document.querySelectorAll('.section-controls a').length === 8,
        );
        const state = () =>
          page.locator('.home-image img').evaluateAll((nodes) =>
            nodes.map((node) => {
              const image = node as HTMLImageElement;
              const { top, bottom } = image.getBoundingClientRect();
              return {
                loading: image.loading,
                priority: image.fetchPriority,
                complete: image.complete,
                width: image.naturalWidth,
                src: image.currentSrc,
                top,
                bottom,
              };
            }),
          );
        const waitNear = async () => {
          if (observerAvailable)
            await page.waitForFunction(() =>
              [...document.querySelectorAll<HTMLImageElement>('.home-image img')].every((image) => {
                const rect = image.getBoundingClientRect();
                return (
                  rect.top > innerHeight * 2.5 ||
                  rect.bottom < -innerHeight * 1.5 ||
                  image.loading === 'eager'
                );
              }),
            );
        };
        await waitNear();
        const initial = await state();
        assert.equal(initial[0]!.loading, 'eager');
        assert.equal(initial[0]!.priority, 'high');
        assert.equal(initial[1]!.loading, 'eager');
        assert.equal(initial[1]!.priority, 'auto');
        for (const image of initial.slice(2)) {
          const near = image.top <= viewport.height * 2.5 && image.bottom >= -viewport.height * 1.5;
          assert.equal(image.loading, observerAvailable && near ? 'eager' : 'lazy');
        }
        assert.ok(
          (
            await page
              .locator('.home-section')
              .evaluateAll((sections) =>
                sections.map((section) => getComputedStyle(section).scrollSnapStop),
              )
          ).every((value) => value === 'always'),
        );
        // The observer extends look-ahead; native loading and picture selection remain intact.
        await page
          .locator('.home-section')
          .nth(6)
          .evaluate((section) => section.scrollIntoView({ behavior: 'instant', block: 'start' }));
        await page.waitForFunction(() => {
          const image = document.querySelectorAll<HTMLImageElement>('.home-image img')[6];
          return image?.complete && image.naturalWidth > 0;
        });
        await waitNear();
        const scrolled = await state();
        assert.ok(scrolled.slice(2).every((image) => image.priority === 'auto'));
        if (!observerAvailable)
          assert.ok(scrolled.slice(2).every((image) => image.loading === 'lazy'));
        // Reverse direction: the same margin also warms images above the viewport.
        await page
          .locator('.home-section')
          .nth(3)
          .evaluate((section) => section.scrollIntoView({ behavior: 'instant', block: 'start' }));
        await waitNear();
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForFunction(
          () => scrollY === 0 && document.documentElement.dataset.homeSection === 'greatness',
        );
        const reloaded = await state();
        assert.equal(reloaded[0]!.priority, 'high');
        assert.equal(reloaded[1]!.loading, 'eager');
        // Back navigation is deliberately different from reload.
        await page
          .locator('.home-section')
          .nth(3)
          .evaluate((section) => section.scrollIntoView({ behavior: 'instant', block: 'start' }));
        await page.waitForFunction(
          () => document.documentElement.dataset.homeSection === 'changemaker',
        );
        const savedScroll = await page.evaluate(() => scrollY);
        await page
          .locator('#tile-changemaker')
          .evaluate((link) => (link as HTMLAnchorElement).click());
        await page.waitForURL('**/regenerative-changemaker/');
        await page.waitForFunction(() => !document.documentElement.dataset.routePhase);
        await page.goBack();
        await page.waitForFunction(
          (saved) => !document.documentElement.dataset.routePhase && Math.abs(scrollY - saved) <= 1,
          savedScroll,
        );
        await page.goto(site + '/#section-workshops', { waitUntil: 'networkidle' });
        await page.waitForFunction(
          () => document.documentElement.dataset.homeSection === 'workshops',
        );
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForFunction(
          () => scrollY > 0 && document.documentElement.dataset.homeSection === 'workshops',
        );
        await page.setViewportSize({ width: viewport.width, height: viewport.height + 300 });
        await waitNear();
        report.push({
          viewport,
          observerAvailable,
          initial,
          scrolled,
          reloaded,
          backRestored: true,
          explicitFragmentPreserved: true,
        });
      } catch (error) {
        report.push({
          viewport,
          observerAvailable,
          failure: String(error),
          page: await context.pages()[0]?.evaluate(() => ({
            url: location.href,
            y: scrollY,
            section: document.documentElement.dataset.homeSection,
            phase: document.documentElement.dataset.routePhase,
            history: history.state,
          })),
        });
        throw error;
      } finally {
        await context.close();
      }
    }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        mode: 'built-file replay; first two eager, 150vh observer look-ahead with native fallback, native snap stops',
        errors,
        report,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
