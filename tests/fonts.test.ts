import { test } from 'node:test';
import assert from 'node:assert/strict';
import { glob, readFile } from 'node:fs/promises';
import { load } from 'cheerio';

test('production pages do not block rendering on external Google Fonts stylesheets', async () => {
  for await (const file of glob('dist/**/*.html')) {
    const $ = load(await readFile(file, 'utf8'));
    for (const el of $('link[rel="stylesheet"]').toArray()) {
      assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test($(el).attr('href')!), file);
    }
  }
});

test('font declarations resolve to real hashed WOFF2 assets and ship licenses', async () => {
  const $ = load(await readFile('dist/index.html', 'utf8'));
  const sheets = await Promise.all(
    $('link[rel="stylesheet"]')
      .toArray()
      .map((el) => readFile(`dist${$(el).attr('href')}`, 'utf8')),
  );
  const css = sheets.join('\n');
  assert.doesNotMatch(css, /fonts\.(googleapis|gstatic)\.com/);
  const faces = [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map((match) => match[0]);
  assert.equal(faces.length, 8, 'Only four weight/style combinations in two Latin subsets');
  for (const face of faces) {
    assert.doesNotMatch(face, /data:|\.woff["')?]/, 'Fonts stay external and WOFF2-only');
    assert.match(face, /unicode-range:/, 'Subsets must not override each other');
    assert.match(face, /font-display:swap/);
    assert.match(face, /-latin(?:-ext)?-/);
  }
  const fonts = [...css.matchAll(/url\(["']?(\/[^\s)"']+\.woff2)["']?\)/g)].map(
    (match) => match[1]!,
  );
  for (const face of [
    'cormorant-garamond-latin-300-italic',
    'open-sans-latin-400-normal',
    'open-sans-latin-600-normal',
    'roboto-latin-400-normal',
  ])
    assert.ok(
      fonts.some((url) => url.includes(face)),
      `Missing Fontsource face: ${face}`,
    );
  for (const font of fonts)
    assert.equal((await readFile(`dist${font}`)).subarray(0, 4).toString(), 'wOF2');
  for (const [name, packageName] of [
    ['cormorant', 'cormorant-garamond'],
    ['open-sans', 'open-sans'],
    ['roboto', 'roboto'],
  ]) {
    const license = await readFile(`dist/fonts/${name}-OFL.txt`, 'utf8');
    assert.match(license, /SIL OPEN FONT LICENSE/);
    assert.equal(
      license,
      await readFile(`node_modules/@fontsource/${packageName}/LICENSE`, 'utf8'),
    );
  }
  const preload = $('link[rel="preload"][as="font"]');
  assert.equal(preload.length, 1);
  assert.ok(fonts.includes(preload.attr('href')!));
  assert.equal(preload.attr('crossorigin'), 'anonymous');
});
