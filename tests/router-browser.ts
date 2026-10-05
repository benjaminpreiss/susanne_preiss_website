import { chromium, type BrowserContext, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';

interface Sample {
  id: number;
  stage: string;
  to: string;
  time: number;
  reduced: boolean;
  mainOpacity: string;
  mainTransform: string;
  menuOpacity?: string;
  menuTransform?: string;
  contactTransform?: string;
}
declare global {
  interface Window {
    __routerStages: Sample[];
    __routerDocumentId: string;
  }
}
const output = process.argv[2];
if (!output) throw new Error('Supply a NEW capture directory');
await mkdir(output, { recursive: false });
const site = process.env.TEST_SITE ?? 'http://127.0.0.1:4321';
const fixtureSite = process.env.TEST_FIXTURE_SITE;
const fixtureRoot = process.env.NAVIGATION_FIXTURE_OUTPUT;
const replay = process.env.TEST_LOCAL_BUILD === '1';
const browser = await chromium.connectOverCDP(process.env.TEST_CDP ?? 'http://127.0.0.1:9222');
const report: Record<string, unknown> = {
  replay,
  browser: browser.version(),
  date: new Date().toISOString(),
};
const errors: string[] = [];
const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
async function files(root: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(root, { withFileTypes: true })).map((item) =>
        item.isDirectory() ? files(join(root, item.name)) : [join(root, item.name)],
      ),
    )
  ).flat();
}
async function context(
  options: Parameters<typeof browser.newContext>[0] = {},
  nativeDisabled = false,
): Promise<BrowserContext> {
  const ctx = await browser.newContext(options);
  if (replay) {
    // Diagnostic replay of the real built files, never modification of the owner's server.
    for (const [origin, root] of [
      [site, resolve('dist')],
      [fixtureSite, fixtureRoot],
    ] as const) {
      if (!origin || !root) continue;
      await ctx.route(`${origin}/**`, async (route) => {
        const path = new URL(route.request().url()).pathname;
        const file = resolve(
          root,
          `.${decodeURIComponent(path)}`,
          ...(path.endsWith('/') ? ['index.html'] : []),
        );
        if (!file.startsWith(`${resolve(root)}/`)) return route.abort();
        try {
          const body = await readFile(file);
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
                    : file.endsWith('.png')
                      ? 'image/png'
                      : file.endsWith('.ico')
                        ? 'image/x-icon'
                        : file.endsWith('.json')
                          ? 'application/json'
                          : 'application/octet-stream';
          await route.fulfill({ status: 200, contentType, body });
        } catch {
          await route.fulfill({ status: 404, body: 'Not found' });
        }
      });
    }
  }
  await ctx.addInitScript((disable) => {
    if (disable)
      Object.defineProperty(document, 'startViewTransition', {
        configurable: true,
        value: undefined,
      });
    window.__routerStages = [];
    window.__routerDocumentId = crypto.randomUUID();
    document.addEventListener('site:page-transition', (event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail: unknown = event.detail;
      if (
        !detail ||
        typeof detail !== 'object' ||
        !('id' in detail) ||
        typeof detail.id !== 'number' ||
        !('stage' in detail) ||
        typeof detail.stage !== 'string' ||
        !('to' in detail) ||
        typeof detail.to !== 'string' ||
        !('time' in detail) ||
        typeof detail.time !== 'number' ||
        !('reduced' in detail) ||
        typeof detail.reduced !== 'boolean'
      )
        return;
      const mainNode = document.querySelector('main');
      const menuNode = document.querySelector('#menu-trigger');
      const contactNode = document.querySelector('#footer-contact');
      const main = mainNode ? getComputedStyle(mainNode) : undefined;
      const menu = menuNode ? getComputedStyle(menuNode) : undefined;
      window.__routerStages.push({
        id: detail.id,
        stage: detail.stage,
        to: detail.to,
        time: detail.time,
        reduced: detail.reduced,
        mainOpacity: main?.opacity ?? '',
        mainTransform: main?.transform ?? '',
        menuOpacity: menu?.opacity,
        menuTransform: menu?.transform,
        contactTransform: contactNode ? getComputedStyle(contactNode).transform : undefined,
      });
    });
  }, nativeDisabled);
  return ctx;
}
function watch(page: Page, origin: string) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('console', (message) => {
    if (/hydration|ownership|GSAP target|duplicate view-transition-name/i.test(message.text()))
      errors.push(message.text());
  });
}
async function verifyArtifact(root: string, origin: string) {
  if (replay) {
    report.artifactSource =
      'local built files replayed in isolated browser contexts; NOT server verification';
    return Object.fromEntries(
      await Promise.all(
        (await files(root)).map(async (file) => [relative(root, file), hash(await readFile(file))]),
      ),
    );
  }
  const ctx = await context();
  const manifest: Record<string, string> = {};
  try {
    const page = await ctx.newPage();
    page.on('requestfailed', (request) =>
      errors.push(`${request.url()}: ${request.failure()?.errorText}`),
    );
    await page.goto(`${origin}/ueber-mich/`, { waitUntil: 'networkidle' });
    for (const file of await files(root)) {
      const path = relative(root, file);
      report.verifyingFile = `${origin}/${path}`;
      const bytes = await page.evaluate(async (url) => {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`${response.status} ${url}`);
        return Array.from(new Uint8Array(await response.arrayBuffer()));
      }, `${origin}/${path}`);
      manifest[path] = hash(await readFile(file));
      assert.equal(hash(Buffer.from(bytes)), manifest[path], `Artifact mismatch: ${path}`);
    }
  } finally {
    await ctx.close();
  }
  return manifest;
}
async function settled(page: Page, path?: string) {
  if (path) await page.waitForURL((url) => url.pathname === path);
  try {
    await page.waitForFunction(
      () =>
        document.body.dataset.routePath === location.pathname &&
        !document.documentElement.dataset.routePhase &&
        !document.querySelector('astro-island[ssr]'),
    );
  } catch (error) {
    report.stuck = await page.evaluate(() => ({
      url: location.href,
      path: document.body.dataset.routePath,
      phase: document.documentElement.dataset.routePhase,
      islands: Array.from(document.querySelectorAll('astro-island')).map((node) =>
        node.outerHTML.slice(0, 600),
      ),
      stages: window.__routerStages,
    }));
    throw error;
  }
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(() => document.body.style.position),
    '',
    'No leftover scroll lock',
  );
  const motionState = await page
    .locator('main')
    .evaluate((node) =>
      node instanceof HTMLElement
        ? { transform: node.style.transform, opacity: node.style.opacity }
        : null,
    );
  assert.deepEqual(motionState, { transform: '', opacity: '' }, 'No leftover page styles');
}
async function stages(
  page: Page,
  before: number,
  mobile: boolean,
  reduced: boolean,
  returning: boolean,
) {
  const samples = await page.evaluate((offset) => window.__routerStages.slice(offset), before);
  assert.deepEqual(
    samples.map((sample) => sample.stage),
    ['exit-start', 'exit-end', 'entry-start', 'entry-end'],
  );
  const exit = samples[1]!;
  const enter = samples[2]!;
  assert.ok(enter.time >= exit.time, 'Exit completes before entry starts');
  if (!reduced) {
    assert.equal(exit.mainOpacity, '0');
    assert.equal(enter.mainOpacity, '0');
    const source = returning ? enter : exit;
    assert.notEqual(source.mainTransform, 'none', 'Content moves left on departure/return');
    if (mobile) assert.equal(source.menuOpacity, '0', 'Touch menu fades');
    else assert.notEqual(source.menuTransform, 'none', 'Desktop menu moves sideways');
    assert.notEqual(source.contactTransform, 'none', 'Footer controls move vertically');
  }
  return samples;
}
try {
  report.productionArtifact = await verifyArtifact(resolve('dist'), site);
  for (const mobile of [false, true])
    for (const reduced of [false, true]) {
      const name = `${mobile ? 'mobile' : 'desktop'}-${reduced ? 'reduce' : 'motion'}`;
      const ctx = await context({
        viewport: mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        deviceScaleFactor: mobile ? 3 : 1,
        reducedMotion: reduced ? 'reduce' : 'no-preference',
        locale: 'de-DE',
      });
      try {
        const page = await ctx.newPage();
        watch(page, site);
        await page.goto(`${site}/ueber-mich/`, { waitUntil: 'networkidle' });
        await settled(page);
        const documentId = await page.evaluate(() => window.__routerDocumentId);
        await page.screenshot({ path: join(output, `${name}-about.png`) });
        const menu = page.locator('#menu-trigger');
        await menu.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(reduced ? 0 : 1100);
        assert.equal(
          await page
            .locator('dialog')
            .evaluate((node) => node instanceof HTMLDialogElement && node.open),
          true,
        );
        assert.equal(
          await page
            .locator('footer')
            .evaluate((node) => node.getBoundingClientRect().top >= innerHeight),
          true,
        );
        assert.equal(await page.locator('#page-return').count(), 0);
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press(i < 5 ? 'Tab' : 'Shift+Tab');
          assert.equal(
            await page.evaluate(() => !!document.activeElement?.closest('dialog')),
            true,
          );
        }
        await page.screenshot({ path: join(output, `${name}-menu.png`) });
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('dialog')?.open);
        assert.equal(await menu.evaluate((node) => node === document.activeElement), true);
        for (let i = 0; i < 10; i++) {
          await menu.click();
          await page.waitForTimeout((i % 3) * 20);
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => !document.querySelector('dialog')?.open);
        }
        await page.evaluate(() => scrollTo(0, 450));
        const menuOriginScroll = await page.evaluate(() => scrollY);
        await menu.click();
        assert.equal(
          await page
            .locator(
              'dialog a[href="/kontakt/"], dialog a[href="/impressum/"], dialog a[href="/datenschutz/"]',
            )
            .count(),
          0,
        );
        await page.locator('dialog a[href="/presse/"]').click();
        await settled(page, '/presse/');
        await page.goBack();
        await settled(page, '/ueber-mich/');
        assert.equal(await menu.evaluate((node) => node === document.activeElement), true);
        assert.ok(
          Math.abs((await page.evaluate(() => scrollY)) - menuOriginScroll) <= 1,
          'Menu departure preserves original scroll',
        );
        for (const [slug, id] of [
          ['kontakt', 'contact'],
          ['impressum', 'imprint'],
          ['datenschutz', 'privacy'],
        ]) {
          await page.evaluate(() => scrollTo(0, 450));
          const y = await page.evaluate(() => scrollY);
          let before = await page.evaluate(() => window.__routerStages.length);
          await page.locator(`#footer-${id}`).click();
          await settled(page, `/${slug}/`);
          report[`${name}-${slug}-open`] = await stages(page, before, mobile, reduced, false);
          assert.equal(
            await page.evaluate(() => window.__routerDocumentId),
            documentId,
            'ClientRouter keeps the document',
          );
          assert.equal(await page.locator('footer a').count(), 1);
          assert.equal(await page.locator('#page-return').innerText(), 'SCHLIESSEN');
          assert.equal(await page.locator('.site-header').count(), 0);
          assert.equal(await page.locator('main h1').count(), 1);
          assert.equal(
            await page.locator('link[rel="canonical"]').getAttribute('href'),
            `https://susanne-preiss.de/${slug}/`,
          );
          assert.ok(await page.locator('.astro-route-announcer').count());
          await page.screenshot({ path: join(output, `${name}-${slug}.png`) });
          if (slug === 'datenschutz') {
            await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
            assert.ok(await page.evaluate(() => scrollY > 0));
            await page.setViewportSize({ width: mobile ? 390 : 1440, height: 500 });
            assert.ok(await page.locator('#page-return').isVisible());
            await page.setViewportSize(
              mobile ? { width: 390, height: 664 } : { width: 1440, height: 900 },
            );
          }
          before = await page.evaluate(() => window.__routerStages.length);
          await page.locator('#page-return').click();
          await settled(page, '/ueber-mich/');
          report[`${name}-${slug}-return`] = await stages(page, before, mobile, reduced, true);
          assert.ok(
            Math.abs((await page.evaluate(() => scrollY)) - y) <= 1,
            'Return restores scroll',
          );
          assert.equal(
            await page.locator(`#footer-${id}`).evaluate((node) => node === document.activeElement),
            true,
          );
          assert.equal(
            await page
              .locator(`#footer-${id}`)
              .evaluate((node) => getComputedStyle(node).textDecorationLine),
            'none',
            'Pointer return has no keyboard underline',
          );
          await page.goForward();
          await settled(page, `/${slug}/`);
          await page.goBack();
          await settled(page, '/ueber-mich/');
        }
        // Keyboard route activation and return must preserve a visible focus indication.
        await page.keyboard.press('Tab');
        await page.locator('#footer-imprint').focus();
        await page.keyboard.press('Enter');
        await settled(page, '/impressum/');
        await page.keyboard.press('Tab');
        await page.locator('#page-return').focus();
        await page.keyboard.press('Enter');
        await settled(page, '/ueber-mich/');
        assert.equal(
          await page
            .locator('#footer-imprint')
            .evaluate((node) => getComputedStyle(node).textDecorationLine),
          'underline',
        );
        // Supersede a preparation/exit with a second link, without racing two animation owners.
        const interruptionStart = await page.evaluate(() => window.__routerStages.length);
        await page.evaluate(() => {
          // One task: a reduced-motion swap may otherwise finish between CDP calls,
          // removing the old page's second link before the test can activate it.
          const first = document.querySelector('#footer-imprint');
          const second = document.querySelector('#footer-privacy');
          if (!(first instanceof HTMLAnchorElement) || !(second instanceof HTMLAnchorElement))
            throw new Error('Missing interruption links');
          first.click();
          second.click();
        });
        await settled(page, '/datenschutz/');
        report[`${name}-interruption`] = await page.evaluate(
          (offset) => window.__routerStages.slice(offset),
          interruptionStart,
        );
        await page.reload();
        await settled(page);
        await page.locator('#page-return').click();
        await settled(page, '/ueber-mich/');
        // CDP-created popup initial requests can bypass diagnostic replay and hit the
        // older owner-served HTML. Exercise this only against the real served artifact.
        if (!mobile && !replay) {
          const popup = ctx.waitForEvent('page');
          await page.locator('#footer-contact').click({ modifiers: ['Control'] });
          const tab = await popup;
          await tab.waitForLoadState('networkidle');
          await settled(tab, '/kontakt/');
          await tab.locator('#page-return').click();
          await settled(tab, '/');
          await tab.close();
        }
        report[name] = 'passed';
        if (replay)
          report.modifiedClick = 'Pending actual server: popup initial request bypasses CDP replay';
      } finally {
        await ctx.close();
      }
    }
  for (const mode of ['no-javascript', 'no-native-api'] as const) {
    const ctx = await context(
      {
        javaScriptEnabled: mode !== 'no-javascript',
        reducedMotion: mode === 'no-native-api' ? 'no-preference' : 'reduce',
      },
      mode === 'no-native-api',
    );
    try {
      const page = await ctx.newPage();
      watch(page, site);
      for (const slug of ['kontakt', 'impressum', 'datenschutz']) {
        await page.goto(`${site}/${slug}/`, { waitUntil: 'networkidle' });
        assert.ok(await page.locator('main').isVisible());
        await page.locator('#page-return').click();
        await page.waitForURL((url) => url.pathname === '/');
        if (mode === 'no-native-api') await settled(page);
        if (mode === 'no-javascript')
          await page.locator('.no-script-navigation a[href="/impressum/"]').click();
        else {
          await page
            .locator('#section-workshops')
            .evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'start' }));
          await page.locator('#footer-imprint').click();
        }
        await page.waitForURL('**/impressum/');
        if (mode === 'no-native-api') await settled(page);
      }
      report[mode] = 'passed';
    } finally {
      await ctx.close();
    }
  }
  if (fixtureSite && fixtureRoot) {
    report.fixtureArtifact = await verifyArtifact(resolve(fixtureRoot), fixtureSite);
    const ctx = await context({ reducedMotion: 'reduce' });
    try {
      const page = await ctx.newPage();
      watch(page, fixtureSite);
      for (const [de, en] of [
        ['kontakt', 'contact'],
        ['impressum', 'en/legal-notice'],
        ['datenschutz', 'legal/privacy-policy'],
      ]) {
        await page.goto(`${fixtureSite}/${de}/`, { waitUntil: 'networkidle' });
        await settled(page);
        await page.getByRole('link', { name: 'English', exact: true }).click();
        await settled(page, `/${en}/`);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        assert.equal(await page.locator('#page-return').innerText(), 'Close');
        // This partial-translation fixture has no English homepage; no German fallback.
        assert.equal(await page.locator('#page-return').getAttribute('href'), '/about-susanne/');
        await page.locator('#page-return').click();
        await settled(page, '/about-susanne/');
        await page.locator('#menu-trigger').click();
        assert.deepEqual(
          await page
            .locator('dialog .main-navigation a')
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))),
          ['/about-susanne/'],
        );
        await page.keyboard.press('Escape');
      }
      report.translations = 'passed';
    } finally {
      await ctx.close();
    }
  } else report.translations = 'NOT RUN';
  assert.deepEqual(errors, []);
  report.result = replay
    ? 'diagnostic built-file replay passed; owner-served artifact acceptance pending'
    : fixtureSite
      ? 'passed'
      : 'production passed; fixture pending';
} catch (error) {
  report.result = 'failed';
  report.failure = String(error);
  throw error;
} finally {
  report.errors = errors;
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
