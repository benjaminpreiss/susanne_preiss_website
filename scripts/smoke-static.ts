import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import { load } from 'cheerio';
import { auditArtifact } from './artifact';

const root = resolve(process.argv[2] ?? 'dist');
const files = await auditArtifact(root);
const mime: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
};
// Plain file server: directory indexes and real 404s, no Astro preview or SPA fallback.
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, 'http://localhost');
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(400).end();
      return;
    }
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = resolve(file, 'index.html');
    let body = await readFile(file).catch(() => null);
    if (!body) {
      file = resolve(root, '404.html');
      body = await readFile(file);
      res.statusCode = 404;
    }
    res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    res.end(body);
  } catch {
    res.writeHead(500).end();
  }
});
await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
assert(address && typeof address !== 'string');
const site = `http://127.0.0.1:${address.port}`;
try {
  // Byte-for-byte completeness check, including PDFs, images and hidden host files.
  for (const file of files) {
    const response = await fetch(`${site}/${file}`);
    assert.equal(response.status, 200, file);
    assert.deepEqual(
      Buffer.from(await response.arrayBuffer()),
      await readFile(resolve(root, file)),
      file,
    );
  }
  const missing = await fetch(`${site}/__missing_ticket09__/`);
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), await readFile(resolve(root, '404.html'), 'utf8'));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.url().startsWith(site) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      for (const file of files.filter((file) => file.endsWith('.html') && file !== '404.html')) {
        const $ = load(await readFile(resolve(root, file), 'utf8'));
        const path = '/' + file.replace(/index\.html$/, '');
        await page.goto(site + path, { waitUntil: 'networkidle' });
        if ($('main').length) {
          assert.equal(await page.locator('main h1').count(), 1, file);
          assert.equal(new URL(page.url()).pathname, path);
        } else if ($('meta[http-equiv="refresh"]').length) {
          const target = new URL($('link[rel="canonical"]').attr('href')!);
          await page.waitForURL(site + target.pathname);
        }
      }
      await page.goto(site + '/ueber-mich/', { waitUntil: 'networkidle' });
      await page.locator('#menu-trigger').click();
      await page.locator('dialog[open] a[href="/presse/"]').click();
      await page.waitForURL(site + '/presse/');
      await page.waitForFunction(() => !document.querySelector('dialog[open]'));
      await page.goto(site + '/html/about.html#about', { waitUntil: 'networkidle' });
      await page.waitForURL(site + '/ueber-mich/#about');
      assert.equal(await page.locator('#about').count(), 1);
      assert.deepEqual(errors, [], `Browser errors at ${width}px`);
      await context.close();
    }
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(site + '/ueber-mich/');
    assert.equal(await page.locator('main h1').count(), 1);
    await context.close();
  } finally {
    await browser.close();
  }
  console.log(
    'Static HTTP bytes, routes, redirects, 404, deep links and desktop/mobile menu smoke passed.',
  );
} finally {
  server.closeAllConnections();
  await new Promise<void>((done, reject) =>
    server.close((error) => (error ? reject(error) : done())),
  );
}
