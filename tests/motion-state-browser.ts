import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { compile } from 'sass';
import { transpileModule, ScriptTarget, ModuleKind } from 'typescript';
import { chromium } from 'playwright';
import type { createMenuMotion, createPageMotion } from '../src/interactions/motion';

declare global {
  interface Window {
    motionFixture: {
      createMenuMotion: typeof createMenuMotion;
      createPageMotion: typeof createPageMotion;
    };
    motionPending?: Promise<{ opacity: string; transform: string }>;
  }
}
const output = process.argv[2];
if (!output) throw new Error('Usage: tsx tests/motion-state-browser.ts <new evidence directory>');
await mkdir(output, { recursive: false });
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
context.setDefaultTimeout(10_000);
const results: unknown[] = [];
try {
  const page = await context.newPage();
  await page.setContent(`<html data-page-kind="content"><head><style>${compile('src/styles/site.scss').css}</style></head><body>
    <header class="site-header"><span class="header-background"></span><a class="home"></a><button id="menu-trigger" class="menu"></button></header>
    <main class="content" style="color:rgb(13, 14, 15)">Controlled content</main>
    <footer class="site-footer"><div class="legal"><a>Legal</a></div><a id="footer-contact">Contact</a></footer>
    <dialog><nav class="main-navigation">Menu</nav><button class="menu dismiss-menu"><span></span><span></span><span></span></button></dialog>
    </body></html>`);
  // Execute the actual module against the installed GSAP browser build, not an animation mock.
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('gsap/dist/gsap.js') });
  const source = await readFile('src/interactions/motion.ts', 'utf8');
  const js = transpileModule(source, {
    compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.CommonJS },
  }).outputText;
  await page.addScriptTag({
    content: `(() => {
    const exports = {};
    const require = name => { if (name === 'gsap') return { gsap: window.gsap }; throw new Error(name); };
    ${js}
    window.motionFixture = exports;
  })();`,
  });

  const route = await page.evaluate(async () => {
    const main = document.querySelector<HTMLElement>('main')!;
    const original = main.style.cssText;
    const exit = window.motionFixture.createPageMotion(document, { entering: false });
    await exit.run();
    const outgoing = {
      transform: getComputedStyle(main).transform,
      opacity: getComputedStyle(main).opacity,
    };
    exit.destroy();
    const entry = window.motionFixture.createPageMotion(document, {
      entering: true,
      returning: true,
    });
    const prepared = {
      transform: getComputedStyle(main).transform,
      opacity: getComputedStyle(main).opacity,
    };
    await entry.run();
    entry.destroy();
    const restored = {
      inline: main.style.cssText,
      opacity: getComputedStyle(main).opacity,
      transform: getComputedStyle(main).transform,
    };
    const cancelled = window.motionFixture.createPageMotion(document, { entering: false });
    const pending = cancelled.run();
    cancelled.destroy();
    cancelled.destroy();
    await pending;
    return { original, outgoing, prepared, restored, cancelled: main.style.cssText };
  });
  results.push({ route });
  assert.equal(route.outgoing.opacity, '0');
  assert.notEqual(route.outgoing.transform, 'none');
  assert.equal(route.prepared.opacity, '0');
  assert.notEqual(route.prepared.transform, 'none');
  assert.deepEqual(route.restored, { inline: route.original, opacity: '1', transform: 'none' });
  assert.equal(route.cancelled, route.original);

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion });
    const menu = await page.evaluate(async () => {
      const dialog = document.querySelector('dialog')!;
      const main = document.querySelector('main')!;
      dialog.showModal();
      const motion = window.motionFixture.createMenuMotion(document, dialog, {
        lightHeader: false,
      });
      await motion.open();
      const open = getComputedStyle(main).opacity;
      motion.pause();
      const exit = window.motionFixture.createPageMotion(document, {
        entering: false,
        menuOpen: true,
      });
      await exit.run();
      const departed = getComputedStyle(dialog.querySelector('.main-navigation')!).opacity;
      exit.destroy();
      motion.resume();
      const recovered = getComputedStyle(dialog.querySelector('.main-navigation')!).opacity;
      await motion.close();
      motion.destroy();
      const closed = getComputedStyle(main).opacity;
      dialog.close();
      return { open, departed, recovered, closed };
    });
    results.push({ reducedMotion, menu });
    assert.equal(menu.open, '0');
    assert.equal(menu.departed, reducedMotion === 'reduce' ? '1' : '0');
    assert.equal(menu.recovered, '1');
    assert.equal(menu.closed, '1');
  }

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const reversed = await page.evaluate(async () => {
    const dialog = document.querySelector('dialog')!;
    dialog.showModal();
    const motion = window.motionFixture.createMenuMotion(document, dialog, { lightHeader: false });
    const opening = motion.open();
    await new Promise((resolve) => setTimeout(resolve, 80));
    motion.pause();
    const paused = getComputedStyle(document.querySelector('main')!).opacity;
    await new Promise((resolve) => setTimeout(resolve, 80));
    const stillPaused = getComputedStyle(document.querySelector('main')!).opacity;
    motion.resume();
    await Promise.all([opening, motion.close()]);
    motion.destroy();
    dialog.close();
    return {
      paused,
      stillPaused,
      restored: getComputedStyle(document.querySelector('main')!).opacity,
    };
  });
  assert.equal(reversed.paused, reversed.stillPaused);
  assert.equal(reversed.restored, '1');
  results.push({ reversed });

  // A preference change must settle a running route, not leave its caller waiting.
  await page.evaluate(() => {
    const motion = window.motionFixture.createPageMotion(document, { entering: false });
    window.motionPending = motion.run().then(() => {
      motion.destroy();
      const style = getComputedStyle(document.querySelector('main')!);
      return { opacity: style.opacity, transform: style.transform };
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.deepEqual(await page.evaluate(() => window.motionPending), {
    opacity: '1',
    transform: 'none',
  });

  // Reduced motion also finishes a paused reverse at the CLOSED endpoint, not the open one.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(async () => {
    const dialog = document.querySelector('dialog')!;
    dialog.showModal();
    const motion = window.motionFixture.createMenuMotion(document, dialog, { lightHeader: false });
    await motion.open();
    window.motionPending = motion.close().then(() => {
      motion.destroy();
      dialog.close();
      const style = getComputedStyle(document.querySelector('main')!);
      return { opacity: style.opacity, transform: style.transform };
    });
    motion.pause();
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.deepEqual(await page.evaluate(() => window.motionPending), {
    opacity: '1',
    transform: 'none',
  });

  // Mobile menu motion must leave neighboring sections and the text's layout translation untouched.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => {
    document.documentElement.dataset.pageKind = 'home';
    document.querySelector('main')!.innerHTML = `<div class="homepage">
      <section class="home-section" data-home-section="active"><div class="home-panel home-image">Image</div><div class="home-panel home-copy">Text</div></section>
      <section class="home-section" data-home-section="neighbor"><div class="home-panel home-image">Other image</div><div class="home-panel home-copy">Other text</div></section>
    </div>`;
  });
  for (let cycle = 0; cycle < 2; cycle++) {
    const portrait = await page.evaluate(async () => {
      const dialog = document.querySelector('dialog')!;
      const copy = document.querySelector<HTMLElement>('.home-copy')!;
      const neighbor = document.querySelector<HTMLElement>(
        '[data-home-section="neighbor"] .home-image',
      )!;
      const before = getComputedStyle(copy).translate;
      const neighborBefore = getComputedStyle(neighbor).transform;
      dialog.showModal();
      const motion = window.motionFixture.createMenuMotion(document, dialog, {
        sectionKey: 'active',
        lightHeader: false,
      });
      await motion.open();
      const during = getComputedStyle(copy).translate;
      const neighborDuring = getComputedStyle(neighbor).transform;
      await motion.close();
      motion.destroy();
      dialog.close();
      return {
        before,
        during,
        after: getComputedStyle(copy).translate,
        neighborBefore,
        neighborDuring,
        inlineTranslate: copy.style.translate,
      };
    });
    assert.equal(portrait.during, portrait.before);
    assert.equal(portrait.after, portrait.before);
    assert.equal(portrait.neighborDuring, portrait.neighborBefore);
    assert.equal(portrait.inlineTranslate, '');
    results.push({ cycle, portrait });
  }
  await page.setContent('<html data-page-kind="content"><body></body></html>');
  await page.evaluate(async () => {
    const motion = window.motionFixture.createPageMotion(document, { entering: false });
    await motion.run();
    motion.destroy();
  });
} finally {
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify({ browser: browser.version(), results }, null, 2),
  );
  await context.close();
  await browser.close();
}
