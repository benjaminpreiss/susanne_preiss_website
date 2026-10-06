import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { compile } from 'sass';
import { chromium } from 'playwright';

// Controlled copy and markup: geometry must not depend on production section names/counts.
// Headless viewport units do NOT emulate retractable mobile browser chrome.
const output = process.argv[2];
if (!output)
  throw new Error('Usage: tsx tests/homepage-sizing-browser.ts <new evidence directory>');
await mkdir(output, { recursive: false });
const css = compile('src/styles/homepage.scss').css;
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const results: unknown[] = [];
const near = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual}, expected ${expected}`);
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    await page.setContent(`<!doctype html><html data-page-kind="home"><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body { margin: 0; } ${css}
        .probe { position: absolute; visibility: hidden; width: 0; }
        #large { height: 100lvh; } #small { height: 100svh; }
      </style></head><body>
      <div class="probe" id="large"></div><div class="probe" id="small"></div>
      <main class="content">${['home-intro', 'home-tile image-left', 'home-tile image-right']
        .map((kind, index) => {
          const image = '<div class="home-panel home-image"></div>';
          const copy = `<div class="home-panel home-copy"><${index ? 'a class="home-tile-link" href="#fixture-0"' : 'div class="home-text"'}><h${index ? '2' : '1'}>Sample</h${index ? '2' : '1'}><p>Brief text.</p></${index ? 'a' : 'div'}></div>`;
          return `<section id="fixture-${index}" class="home-section ${kind}">${index ? image + copy : copy + image}</section>`;
        })
        .join('')}</main></body></html>`);
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 390, height: 664 },
      { width: 844, height: 390 },
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      const geometry = await page.locator('.home-section').evaluateAll((sections) => {
        const large = document.getElementById('large')!.getBoundingClientRect().height;
        const small = document.getElementById('small')!.getBoundingClientRect().height;
        return sections.map((section) => {
          const rect = section.getBoundingClientRect();
          const image = section.querySelector('.home-image')!.getBoundingClientRect();
          const copy = section.querySelector('.home-copy')!.getBoundingClientRect();
          return {
            large,
            small,
            width: rect.width,
            height: rect.height,
            imageHeight: image.height,
            copyHeight: copy.height,
            imageWidth: image.width,
            copyWidth: copy.width,
            imageTop: image.top - rect.top,
            copyTop: copy.top - rect.top,
            imageMargin: parseFloat(
              getComputedStyle(section.querySelector('.home-image')!).marginBottom,
            ),
            translation: getComputedStyle(section.querySelector('.home-copy')!).translate,
            snap: getComputedStyle(section).scrollSnapAlign,
            tile: section.classList.contains('home-tile'),
            textTop:
              section.querySelector('.home-copy')!.firstElementChild!.getBoundingClientRect().top -
              copy.top,
            textHeight: section
              .querySelector('.home-copy')!
              .firstElementChild!.getBoundingClientRect().height,
            paddingBottom: parseFloat(
              getComputedStyle(section.querySelector('.home-copy')!).paddingBottom,
            ),
            alignment: getComputedStyle(section.querySelector('.home-copy')!).alignItems,
          };
        });
      });
      for (const box of geometry) {
        assert.equal(box.snap, 'start');
        if (viewport.width <= viewport.height) {
          near(box.height, box.small, 'section target');
          near(box.imageHeight, box.small / 2, 'image target');
          near(box.copyHeight, box.small / 2, 'copy target');
          near(box.imageMargin, 0, 'no negative image margin');
          assert.ok(
            ['0px', '0px 0px'].includes(box.translation),
            'no offset when dynamic and small viewports coincide',
          );
          near(box.imageTop, 0, 'image first, including intro');
          near(box.copyTop, box.imageHeight, 'panels abut');
          near(box.imageWidth, box.width, 'portrait image width');
          near(box.copyWidth, box.width, 'portrait copy width');
          if (box.tile) {
            assert.equal(box.alignment, 'center');
            near(box.paddingBottom, 0, 'portrait tile has no extra bottom padding');
            near(
              box.textTop,
              (box.copyHeight - box.paddingBottom - box.textHeight) / 2,
              'portrait tile text is centered in the remaining area',
            );
          }
        } else {
          near(box.imageMargin, 0, 'desktop has no negative margin');
          assert.equal(box.translation, 'none', 'desktop has no copy offset');
          assert.equal(box.alignment, 'center', 'desktop copy remains vertically centered');
          near(box.height, box.small, 'unchanged desktop target');
          near(box.imageHeight, box.height, 'desktop image height');
          near(box.copyHeight, box.height, 'desktop copy height');
          near(box.imageWidth, box.width / 2, 'desktop image width');
          near(box.copyWidth, box.width / 2, 'desktop copy width');
        }
      }
      const margins = await page.locator('.home-intro h1, .home-intro p').evaluateAll((nodes) =>
        nodes.map((node) => ({
          left: parseFloat(getComputedStyle(node).marginLeft),
          right: parseFloat(getComputedStyle(node).marginRight),
        })),
      );
      const expectedMargin =
        viewport.width <= viewport.height
          ? 22 + Math.min(viewport.width, viewport.height) * 0.015
          : 30 + Math.min(viewport.width, viewport.height) * 0.075;
      for (const margin of margins) {
        near(margin.left, expectedMargin, 'intro left margin');
        near(margin.right, expectedMargin, 'intro right margin');
      }
      results.push({ viewport, geometry, margins });
    }
    // Reduced motion must disable image growth, flow compensation and text translation.
    assert.ok(
      await page
        .locator('.home-section, .home-panel')
        .evaluateAll((panels) =>
          panels.every((panel) => getComputedStyle(panel).transitionDuration === '0s'),
        ),
      'reduced motion disables offset transitions',
    );
    // Synthetic unequal small/large viewports exercise the gap geometry, not real browser chrome.
    // Real headless viewport units coincide, which would otherwise conceal final-slide clamping.
    const small = 664;
    const large = 844;
    await page.addStyleTag({
      content: css.replace(
        /([\d.]+)(s|l)vh/g,
        (_, value: string, unit: string) =>
          `${(Number(value) * (unit === 's' ? small : large)) / 100}px`,
      ),
    });
    for (const height of [large, small, large]) {
      await page.setViewportSize({ width: 390, height });
      const gaps = await page.locator('.home-section').evaluateAll((nodes) =>
        nodes.map((node, index) => ({
          margin: parseFloat(getComputedStyle(node).marginBottom),
          distance: nodes[index + 1]
            ? nodes[index + 1]!.getBoundingClientRect().top - node.getBoundingClientRect().bottom
            : null,
        })),
      );
      for (const gap of gaps) {
        near(gap.margin, large - small, 'fixed beige gap, including final slide');
        if (gap.distance !== null)
          near(gap.distance, large - small, 'fixed space between section boxes');
      }
      assert.equal(
        await page.evaluate(() => getComputedStyle(document.body, '::after').content),
        'none',
        'no fixed overlay covers content',
      );
      const sections = await page.locator('.home-section').all();
      // Visit in both directions, including the final slide at the document boundary.
      for (const section of [...sections, ...sections.toReversed()]) {
        near(
          (await section.boundingBox())!.height,
          small,
          'section height ignores toolbar changes',
        );
        near(
          (await section.locator('.home-image').boundingBox())!.height,
          small / 2 + height - small,
          'image absorbs toolbar space',
        );
        near(
          (await section.locator('.home-copy').boundingBox())!.height,
          small / 2,
          'copy target remains half the small viewport',
        );
        await section.evaluate((node) =>
          node.scrollIntoView({ block: 'start', behavior: 'instant' }),
        );
        await page.waitForFunction(
          (id) => Math.abs(document.getElementById(id)!.getBoundingClientRect().top) < 1,
          await section.evaluate((node) => node.id),
        );
      }
      // Native wheel scrolling must settle at the slide top in both directions, not the gap.
      await page.mouse.move(100, 200);
      for (const [delta, index] of [
        [700, 1],
        [-700, 0],
      ] as const) {
        await page.mouse.wheel(0, delta);
        await page.waitForFunction(
          (index) =>
            Math.abs(
              document.querySelectorAll('.home-section')[index]!.getBoundingClientRect().top,
            ) < 1,
          index,
        );
      }
      results.push({ syntheticViewport: { small, large, visible: height }, gaps });
    }
    // Keep small/large units fixed and change only dvh: model chrome retraction/expansion.
    // Inspect visible geometry at the halfway point, not merely computed offsets.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const height of [small, large]) {
      await page.setViewportSize({ width: 390, height });
      const animation = await page.locator('.home-section').evaluateAll((sections) => {
        const transitions = sections.flatMap((section) => [
          ...section.getAnimations(),
          ...section.querySelector('.home-image')!.getAnimations(),
          ...section.querySelector('.home-copy')!.getAnimations(),
        ]);
        for (const transition of transitions) {
          transition.pause();
          transition.currentTime = 150;
        }
        const samples = sections.map((section, index) => {
          const rect = section.getBoundingClientRect();
          const image = section.querySelector('.home-image')!.getBoundingClientRect();
          const copy = section.querySelector('.home-copy')!.getBoundingClientRect();
          return {
            imageHeight: image.height,
            sectionHeight: rect.height,
            imageMargin: parseFloat(
              getComputedStyle(section.querySelector('.home-image')!).marginBottom,
            ),
            copyTop: copy.top - rect.top,
            gap: parseFloat(getComputedStyle(section).marginBottom),
            nextStart: sections[index + 1]
              ? sections[index + 1]!.getBoundingClientRect().top - rect.top
              : null,
          };
        });
        const timings = transitions.map((transition) => transition.effect!.getTiming());
        for (const transition of transitions) transition.finish();
        return { timings, samples };
      });
      assert.equal(
        animation.timings.length,
        9,
        'height, negative margin and translation animate on all sections',
      );
      for (const timing of animation.timings) {
        assert.equal(timing.duration, 300);
        assert.equal(timing.easing, 'ease');
      }
      for (const sample of animation.samples) {
        assert.ok(
          sample.imageHeight > small / 2 && sample.imageHeight < small / 2 + large - small,
          'image visibly interpolates rather than jumping',
        );
        near(sample.copyTop, sample.imageHeight, 'text moves down with the growing image');
        near(sample.sectionHeight, small, 'section stays fixed during animation');
        near(sample.gap, large - small, 'beige gap stays fixed during animation');
        near(
          sample.imageHeight + sample.imageMargin,
          small / 2,
          'image flow footprint stays fixed',
        );
        if (sample.nextStart !== null)
          near(sample.nextStart, large, 'next slide start stays fixed');
      }
      results.push({ animatedViewportHeight: height, animation });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Keep the synthetic toolbar range for tall text too: translated overflow must be reachable.
    await page.setViewportSize({ width: 390, height: large });
    // Extra copy and enlarged text must grow each section, not the image or a scroll panel.
    await page.locator('.home-copy p').evaluateAll((paragraphs) => {
      for (const paragraph of paragraphs) paragraph.textContent = 'Additional text. '.repeat(80);
      document.documentElement.style.fontSize = '32px';
    });
    for (const height of [small, large]) {
      await page.setViewportSize({ width: 390, height });
      for (const section of await page.locator('.home-section').all()) {
        const box = await section.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const image = node.querySelector('.home-image')!.getBoundingClientRect();
          const copy = node.querySelector('.home-copy')!;
          const content = copy.firstElementChild!.getBoundingClientRect();
          const copyRect = copy.getBoundingClientRect();
          return {
            height: rect.height,
            imageHeight: image.height,
            copyHeight: copyRect.height,
            contentTop: content.top - copyRect.top,
            contentBottom: copyRect.bottom - content.bottom,
            overflow: getComputedStyle(copy).overflowY,
          };
        });
        near(
          box.imageHeight,
          small / 2 + height - small,
          'long copy does not enlarge/shrink image',
        );
        near(box.height, small / 2 + box.copyHeight, 'tall section uses stable layout footprint');
        assert.ok(box.height > 844, 'section grows');
        assert.ok(box.contentTop >= -1 && box.contentBottom >= -1, 'copy is contained');
        assert.equal(box.overflow, 'visible', 'no clipping or nested scrolling');
        await section.evaluate((node) => {
          const content = node.querySelector('.home-copy')!.firstElementChild!;
          content.scrollIntoView({ block: 'end', behavior: 'instant' });
        });
        await page.waitForFunction(
          (id) => {
            const bottom = document
              .getElementById(id)!
              .querySelector('.home-copy')!
              .firstElementChild!.getBoundingClientRect().bottom;
            return bottom > 0 && bottom <= innerHeight + 1;
          },
          await section.evaluate((node) => node.id),
        );
        results.push({ viewportHeight: height, tall: box });
      }
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      'enlarged text has no horizontal overflow',
    );
    await page.screenshot({ path: join(output, 'enlarged-text.png') });
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
