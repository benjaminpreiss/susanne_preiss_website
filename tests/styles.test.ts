import assert from 'node:assert/strict';
import test from 'node:test';
import { compile, compileString } from 'sass';

const loadPaths = ['src/styles'];
const compact = (css: string) => css.replace(/\s+/g, '');

function render(properties: string) {
  return compileString(
    `@use 'responsive'; .probe { @include responsive.values((${properties})); }`,
    {
      loadPaths,
    },
  ).css;
}

test('site styles compile without Sass deprecations', () => {
  const warnings: string[] = [];
  for (const file of ['site', 'homepage']) {
    compile(`src/styles/${file}.scss`, {
      logger: { warn: (message) => warnings.push(message) },
    });
  }
  assert.deepEqual(warnings, []);
});

test('responsive sizes retain the fixed floor and two-dimensional legacy sizing', () => {
  for (const [value, expected] of [
    [0, '0rem'],
    [10, '0.625rem'],
    [20, '1.25rem'],
  ] as const) {
    assert.equal(compact(render(`font-size: ${value}px`)), `.probe{font-size:${expected};}`);
  }
  assert.equal(
    compact(render('font-size: 73px')),
    compact(`
    .probe { font-size: calc(1.58125rem + 3.975vmin); }
    @media (min-width: 1200px) and (min-height: 1200px) {
      .probe { font-size: 4.5625rem; }
    }
  `),
  );
});

test('base shorthand overrides precede responsive breakpoint overrides', () => {
  assert.equal(
    compact(render('margin: 40px, margin-bottom: 0')),
    compact(`
    .probe { margin: calc(1.375rem + 1.5vmin); margin-bottom: 0; }
    @media (min-width: 1200px) and (min-height: 1200px) {
      .probe { margin: 2.5rem; }
    }
  `),
  );
});

test('portrait homepage tiles use dynamic minimum heights without clipping text', () => {
  const css = compact(compile('src/styles/homepage.scss').css);
  assert.match(
    css,
    /\.home-section,\.home-section\.image-right\{flex-direction:column;min-height:100dvh;/,
  );
  assert.match(css, /\.home-image\{min-height:50dvh;/);
  assert.match(css, /\.home-copy\{min-height:50dvh;/);
  assert.match(css, /\.home-intro\.home-image\{order:-1;flex:1050dvh;/);
});

test('unsupported responsive values fail explicitly', () => {
  for (const value of ['auto', '2rem', '-10px', '40']) {
    assert.throws(() => render(`font-size: ${value}`), /non-negative px values or zero/);
  }
});
