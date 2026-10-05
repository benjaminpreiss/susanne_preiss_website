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
    await page.setContent(`<!doctype html><html data-page-kind="home"><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body { margin: 0; } ${css}
        .probe { position: absolute; visibility: hidden; width: 0; }
        #large { height: 100lvh; } #small { height: 100svh; }
      </style></head><body>
      <div class="probe" id="large"></div><div class="probe" id="small"></div>
      <main>${['home-intro', 'home-tile image-left', 'home-tile image-right']
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
            snap: getComputedStyle(section).scrollSnapAlign,
          };
        });
      });
      for (const box of geometry) {
        assert.equal(box.snap, 'start');
        if (viewport.width <= viewport.height) {
          near(box.height, box.large, 'section target');
          near(box.imageHeight, box.small / 2, 'image target');
          near(box.copyHeight, box.large - box.small / 2, 'copy target including padding');
          near(box.imageTop, 0, 'image first, including intro');
          near(box.copyTop, box.imageHeight, 'panels abut');
          near(box.imageWidth, box.width, 'portrait image width');
          near(box.copyWidth, box.width, 'portrait copy width');
        } else {
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
    // Extra copy and enlarged text must grow each section, not the image or a scroll panel.
    await page.locator('.home-copy p').evaluateAll((paragraphs) => {
      for (const paragraph of paragraphs) paragraph.textContent = 'Additional text. '.repeat(80);
      document.documentElement.style.fontSize = '32px';
    });
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
      near(box.imageHeight, 422, 'long copy does not enlarge/shrink image');
      near(box.height, box.imageHeight + box.copyHeight, 'long section contains both panels');
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
      results.push({ tall: box });
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
