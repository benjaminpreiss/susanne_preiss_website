import { chromium, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const output = process.argv[2];
if (!output) throw new Error('Supply a new evidence directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const replay = process.env.TEST_LOCAL_BUILD === '1';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const errors: string[] = [];
const results: unknown[] = [];
async function files(root: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(root, { withFileTypes: true })).map((item) =>
        item.isDirectory() ? files(join(root, item.name)) : [join(root, item.name)],
      ),
    )
  ).flat();
}
const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
const artifact = Object.fromEntries(
  await Promise.all(
    (await files(resolve('dist'))).map(async (file) => [
      relative(resolve('dist'), file),
      hash(await readFile(file)),
    ]),
  ),
);
async function replayBuild(context: Awaited<ReturnType<typeof browser.newContext>>) {
  if (!replay) return;
  await context.route(`${site}/**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = resolve('dist', `.${path}`, ...(path.endsWith('/') ? ['index.html'] : []));
    if (!file.startsWith(resolve('dist') + '/')) return route.abort();
    try {
      await route.fulfill({ path: file });
    } catch {
      await route.fulfill({ status: 404, body: 'Missing artifact file' });
    }
  });
}
async function settled(page: Page, path = '/') {
  await page.waitForURL((url) => url.pathname === path);
  await page.waitForFunction(
    () =>
      !document.documentElement.dataset.routePhase && !document.querySelector('astro-island[ssr]'),
  );
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.body.style.position), '');
}
async function section(page: Page, key: string) {
  await page
    .locator(`.home-section[data-home-section="${key}"]`)
    .evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'start' }));
  try {
    await page.waitForFunction(
      (value) => document.documentElement.dataset.homeSection === value,
      key,
    );
  } catch (error) {
    await writeFile(
      join(output!, 'section-failure.json'),
      JSON.stringify(
        await page.evaluate(() => ({
          scroll: scrollY,
          active: document.documentElement.dataset.homeSection,
          focus: document.activeElement?.outerHTML,
          sections: [...document.querySelectorAll('.home-section')].map((node) => ({
            id: node.id,
            top: node.getBoundingClientRect().top,
            height: node.getBoundingClientRect().height,
          })),
        })),
        null,
        2,
      ),
    );
    throw error;
  }
  await page.waitForTimeout(450);
  await page
    .locator(`.home-section[data-home-section="${key}"] img`)
    .evaluateAll((images) =>
      Promise.all(
        images.map((image) => (image instanceof HTMLImageElement ? image.decode() : undefined)),
      ),
    );
}
try {
  for (const mobile of [false, true])
    for (const reduced of [false, true]) {
      const name = `${mobile ? 'mobile' : 'desktop'}-${reduced ? 'reduce' : 'motion'}`;
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
        deviceScaleFactor: mobile ? 3 : 1,
        isMobile: mobile,
        hasTouch: mobile,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      });
      try {
        await replayBuild(context);
        await context.addInitScript(() => {
          const stages: { stage: string; time: number }[] = [];
          Object.assign(window, { homeStages: stages });
          document.addEventListener('site:page-transition', (event) =>
            stages.push((event as CustomEvent).detail),
          );
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
        page.on('response', (response) => {
          if (response.url().startsWith(site) && response.status() >= 400)
            errors.push(`${name}: ${response.status()} ${response.url()}`);
        });
        await page.goto(`${site}/`, { waitUntil: 'networkidle' });
        await settled(page);
        if (!mobile && !reduced && !replay)
          for (const [file, expected] of Object.entries(artifact)) {
            const bytes = await page.evaluate(async (url) => {
              const response = await fetch(url, { cache: 'no-store' });
              if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
              return Array.from(new Uint8Array(await response.arrayBuffer()));
            }, `${site}/${file}`);
            assert.equal(hash(Buffer.from(bytes)), expected, `Served artifact mismatch: ${file}`);
          }
        assert.equal(await page.locator('.section-controls a').count(), 8);
        assert.equal(
          await page
            .locator('#menu-trigger')
            .evaluate((node) => getComputedStyle(node.parentElement!).opacity),
          '0',
        );
        for (const key of [
          'greatness',
          'workshops',
          'personal',
          'changemaker',
          'nachhaltigkeit',
          'business',
          'management',
          'speaker',
        ]) {
          await section(page, key);
          await page.screenshot({ path: join(output, `${name}-${key}.png`) });
          assert.equal(await page.locator('.section-controls [aria-current]').count(), 1);
          const current = page.locator(`.home-section[data-home-section="${key}"]`);
          const light = (await current.getAttribute('data-control-tone')) === 'light';
          const menuLight =
            (await current.getAttribute(mobile ? 'data-mobile-menu-tone' : 'data-control-tone')) ===
            'light';
          assert.equal(
            await page.locator('#menu-trigger').evaluate((node) => getComputedStyle(node).color),
            menuLight ? 'rgb(239, 234, 227)' : 'rgb(43, 44, 54)',
          );
          assert.equal(
            await page.locator('.site-footer').evaluate((node) => getComputedStyle(node).color),
            light && !mobile ? 'rgb(239, 234, 227)' : 'rgb(0, 0, 0)',
          );
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
            `${name}/${key}: horizontal overflow`,
          );
        }
        await section(page, 'workshops');
        // Rapid keys must retain a discrete target, never retarget from an intermediate viewport.
        await page.locator('main').focus();
        for (let count = 0; count < 3; count++) await page.keyboard.press('ArrowDown');
        await page.waitForFunction(
          () =>
            Math.abs(
              document.getElementById('section-nachhaltigkeit')!.getBoundingClientRect().top,
            ) < 2,
        );
        for (let count = 0; count < 3; count++) await page.keyboard.press('ArrowUp');
        await page.waitForFunction(
          () =>
            Math.abs(document.getElementById('section-workshops')!.getBoundingClientRect().top) < 2,
        );
        for (const key of ['ArrowDown', 'ArrowUp', 'ArrowDown', 'ArrowUp'])
          await page.keyboard.press(key);
        await page.waitForFunction(
          () =>
            Math.abs(document.getElementById('section-workshops')!.getBoundingClientRect().top) < 2,
        );
        await page.waitForTimeout(700);
        assert.ok(
          Math.abs(
            await page
              .locator('#section-workshops')
              .evaluate((node) => node.getBoundingClientRect().top),
          ) < 2,
        );
        const before = await page.evaluate(() => scrollY);
        // Local scale belongs to the anchor, never the departing panel.
        await page.locator('#tile-workshops').focus();
        await page.waitForTimeout(250);
        const scale = await page
          .locator('#tile-workshops')
          .evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a);
        assert.ok(Math.abs(scale - (reduced ? 1 : 1.1)) < 0.001);
        await page.locator('#menu-trigger').click();
        if (!reduced) {
          await page.waitForTimeout(150);
          assert.ok(
            Number(
              await page
                .locator('.main-navigation')
                .evaluate((node) => getComputedStyle(node).opacity),
            ) < 0.02,
            'Menu waits for homepage exit',
          );
          const pose = await page
            .locator(mobile ? '.homepage' : '#section-workshops .home-left')
            .evaluate((node) => getComputedStyle(node).transform);
          assert.notEqual(pose, 'none');
        }
        await page.waitForTimeout(reduced ? 50 : 1300);
        assert.equal(
          await page
            .locator('.site-footer')
            .evaluate((node) => node.getBoundingClientRect().top >= innerHeight),
          true,
        );
        assert.equal(await page.locator('#page-return').count(), 0);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('dialog[open]'));
        assert.ok(Math.abs((await page.evaluate(() => scrollY)) - before) < 3);
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'menu-trigger');
        for (const [trigger, path] of [
          ['#footer-contact', '/kontakt/'],
          ['#footer-imprint', '/impressum/'],
          ['#footer-privacy', '/datenschutz/'],
        ] as const) {
          await page.locator(trigger).click();
          await settled(page, path);
          assert.equal(await page.locator('footer a').count(), 1);
          await page.locator('#page-return').click();
          await settled(page);
          const returned = await page.evaluate(() => ({
            scroll: scrollY,
            state: history.state,
            section: document.documentElement.dataset.homeSection,
          }));
          results.push({ name, trigger, before, returned });
          assert.ok(
            Math.abs(returned.scroll - before) < 3,
            `Utility return restores section: ${JSON.stringify(returned)}, expected ${before}`,
          );
        }
        await page.locator('#tile-workshops').click();
        await settled(page, '/workshops/');
        await page.goBack();
        await settled(page);
        assert.ok(
          Math.abs((await page.evaluate(() => scrollY)) - before) < 3,
          'Tile Back restores section',
        );
        assert.equal(
          await page.locator('.section-controls a').count(),
          8,
          'No duplicated controls after repeated return',
        );
        for (const [key, path] of [
          ['personal', '/personalentwicklung/'],
          ['changemaker', '/regenerative-changemaker/'],
          ['nachhaltigkeit', '/nachhaltigkeit/'],
          ['business', '/business-coaching/'],
          ['management', '/top-management-sparring/'],
          ['speaker', '/key-note-speaker/'],
        ] as const) {
          await section(page, key);
          const saved = await page.evaluate(() => scrollY);
          await page.locator(`#tile-${key}`).click();
          await settled(page, path);
          await page.goBack();
          await settled(page);
          assert.ok(
            Math.abs((await page.evaluate(() => scrollY)) - saved) < 3,
            `${key}: Back restores its section`,
          );
          assert.equal(await page.locator('.section-controls a').count(), 8);
          assert.equal(
            await page.evaluate(() => document.documentElement.dataset.homeSection),
            key,
          );
        }
        await section(page, 'nachhaltigkeit');
        await page.locator('#footer-contact').click();
        await settled(page, '/kontakt/');
        await page.locator('#page-return').click();
        await settled(page);
        const lightReturn = await page.locator('#menu-trigger').evaluate((node) => ({
          color: getComputedStyle(node).color,
          style: node.getAttribute('style'),
          root: document.documentElement.dataset,
          scroll: scrollY,
          history: history.state,
        }));
        results.push({ name, lightReturn });
        assert.equal(
          lightReturn.color,
          (await page
            .locator('#section-nachhaltigkeit')
            .getAttribute(mobile ? 'data-mobile-menu-tone' : 'data-control-tone')) === 'light'
            ? 'rgb(239, 234, 227)'
            : 'rgb(43, 44, 54)',
          'Authored controls return after utility closure',
        );
        await section(page, 'workshops');
        await page.locator('#menu-trigger').click();
        await page.waitForTimeout(reduced ? 50 : 1300);
        await page.locator('dialog a[href="/business-coaching/"]').click();
        await settled(page, '/business-coaching/');
        await page.goBack();
        await settled(page);
        await page.goForward();
        await settled(page, '/business-coaching/');
        await page.goBack();
        await settled(page);
        assert.ok(
          Math.abs((await page.evaluate(() => scrollY)) - before) < 3,
          'Menu departure and Forward/Back restore scroll without locks',
        );
        const stages = await page.evaluate(
          () => (window as unknown as { homeStages: { stage: string; time: number }[] }).homeStages,
        );
        for (let i = 0; i < stages.length; i += 4) {
          assert.deepEqual(
            stages.slice(i, i + 4).map((stage) => stage.stage),
            ['exit-start', 'exit-end', 'entry-start', 'entry-end'],
          );
          assert.ok(stages[i + 2]!.time >= stages[i + 1]!.time);
        }
        // Interrupt a menu entrance and confirm its single timeline restores everything.
        await page.locator('#menu-trigger').click();
        await page.waitForTimeout(100);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('dialog[open]'));
        assert.equal(await page.evaluate(() => document.body.style.position), '');
        assert.equal(
          await page.locator('.homepage').evaluate((node) => (node as HTMLElement).style.transform),
          '',
        );
        // Native wheel and keyboard reach subsequent content without hijacked input.
        await page.mouse.move(100, 300);
        await page.mouse.wheel(0, 750);
        await page.waitForTimeout(900);
        assert.ok((await page.evaluate(() => scrollY)) > before);
        assert.ok(
          await page
            .locator('.home-section')
            .evaluateAll((nodes) =>
              nodes.some((node) => Math.abs(node.getBoundingClientRect().top) < 2),
            ),
          'Wheel settles at a section boundary',
        );
        await page.locator('main').focus();
        await page.keyboard.press('End');
        await page.waitForTimeout(900);
        assert.equal(
          await page.evaluate(() => document.documentElement.dataset.homeSection),
          'speaker',
        );
        await section(page, 'workshops');
        if (mobile) {
          const start = await page.evaluate(() => scrollY);
          const input = await context.newCDPSession(page);
          await input.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: 195, y: 540 }],
          });
          for (let y = 510; y >= 150; y -= 30) {
            await input.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [{ x: 195, y }],
            });
            await page.waitForTimeout(16);
          }
          await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await page.waitForTimeout(800);
          assert.ok(
            (await page.evaluate(() => scrollY)) > start,
            'Emulated touch swipe scrolls natively',
          );
          assert.ok(
            await page
              .locator('.home-section')
              .evaluateAll((nodes) =>
                nodes.some((node) => Math.abs(node.getBoundingClientRect().top) < 2),
              ),
            'Touch settles at a section boundary',
          );
          await input.detach();
        } else {
          await page.locator('.section-controls a[href="#section-personal"]').focus();
          await page.keyboard.press('Enter');
          await page.waitForFunction(
            () => document.documentElement.dataset.homeSection === 'personal',
          );
        }
        await page.setViewportSize({ width: 800, height: 480 });
        await page.waitForTimeout(900);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        // A taller-than-viewport section must remain scrollable, not trap its lower content.
        await page.locator('#section-workshops .home-copy').evaluate((node) => {
          const text = document.createElement('p');
          text.textContent = 'Long-section reachability fixture. '.repeat(150);
          node.append(text);
        });
        await page.waitForTimeout(900); // Let native re-snapping after the fixture's layout change finish.
        await page.locator('main').focus();
        await section(page, 'workshops');
        const tall = await page.locator('#section-workshops').boundingBox();
        assert.ok(tall && tall.height > 480);
        const longStart = await page.evaluate(() => scrollY);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(600);
        const longScroll = await page.evaluate(() => scrollY);
        assert.ok(
          longScroll > longStart && longScroll < longStart + tall.height - 480,
          'Arrow key scrolls within a tall section before leaving it',
        );
        await page
          .locator('#section-workshops .home-copy > p')
          .evaluate((node) => node.scrollIntoView({ block: 'end', behavior: 'instant' }));
        await page.keyboard.press('End');
        await page.waitForTimeout(600);
        assert.equal(
          await page.evaluate(() => document.documentElement.dataset.homeSection),
          'speaker',
        );
        results.push({ name, stages, restoredScroll: before });
      } finally {
        await context.close();
      }
    }
  for (const javascript of [false, true]) {
    const context = await browser.newContext({
      javaScriptEnabled: javascript,
      viewport: { width: 390, height: 664 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      await replayBuild(context);
      if (javascript)
        await context.addInitScript(() =>
          Object.defineProperty(document, 'startViewTransition', {
            configurable: true,
            value: undefined,
          }),
        );
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${site}/index.html#regenerativeFrameWork`, { waitUntil: 'networkidle' });
      await page.waitForURL((url) => url.pathname === '/index.html');
      assert.equal(await page.locator('.home-section').count(), 8);
      // /index.html is the homepage document itself, preserving fragments even without JS.
      assert.equal(new URL(page.url()).hash, '#regenerativeFrameWork');
      await page.locator('#tile-workshops').click();
      await page.waitForURL((url) => url.pathname === '/workshops/');
      if (javascript) await settled(page, '/workshops/');
      results.push({ fallback: javascript ? 'no-native-view-transitions' : 'no-javascript' });
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify(
      {
        replay,
        date: new Date().toISOString(),
        artifact,
        browser: browser.version(),
        errors,
        results,
      },
      null,
      2,
    ),
  );
  await browser.close(); // Playwright disconnects this CDP client; never send raw Browser.close.
}
