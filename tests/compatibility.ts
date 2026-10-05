import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

declare global {
  interface Window {
    gsap: typeof import('gsap').gsap;
  }
}

const require = createRequire(import.meta.url);
const output = process.argv[2];
if (!output) throw new Error('Provide a new report file path');
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const context = await browser.newContext();
const errors: string[] = [];
try {
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  // Isolated runtime smoke test, not a modified or served production page.
  await page.setContent('<!doctype html><html><body><div id="motion"></div></body></html>');
  await page.addScriptTag({ path: require.resolve('gsap/dist/gsap.js') });
  const result = await page.evaluate(async () => {
    const target = document.getElementById('motion');
    if (!target) throw new Error('Missing animation fixture');
    const animation = window.gsap.context(() => {
      window.gsap.to(target, { x: 40, duration: 1, paused: true }).progress(1);
    });
    const x = Number(window.gsap.getProperty(target, 'x'));
    animation.revert();
    const reverted = target.style.transform;
    return { gsap: window.gsap.version, x, reverted };
  });
  assert.equal(result.gsap, '3.15.0');
  assert.equal(result.x, 40);
  assert.equal(result.reverted, '');
  assert.deepEqual(errors, []);
  await writeFile(
    output,
    JSON.stringify(
      {
        date: new Date().toISOString(),
        browser: browser.version(),
        node: process.version,
        result,
        errors,
        limitation:
          'Isolated GSAP UMD smoke only. Video.js 10 playback and lifecycle are tested against production output in video-browser.ts; historical v8 smoke is archived under .scratch/ticket07.',
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  );
} finally {
  await context.close();
  await browser.close();
}
