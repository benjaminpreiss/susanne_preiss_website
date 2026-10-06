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

test('portrait image growth preserves section height and its fixed beige gap', () => {
  const css = compact(compile('src/styles/homepage.scss').css);
  assert.match(
    css,
    /\.home-section,\.home-section\.image-right\{flex-direction:column;height:100svh;/,
  );
  assert.match(css, /\.home-image\{flex:00auto;height:50svh;overflow:visible;contain:layout;/);
  assert.match(css, /\.home-copy\{flex:00auto;height:50svh;min-height:0;padding:0;/);
  assert.match(css, /\.home-intro\.home-image\{order:-1;\}/);
  assert.match(css, /\.home-intro\.home-copy\{overflow:visible;\}/);
  assert.match(css, /\.home-panel\{width:50%;min-width:0;box-sizing:border-box;/);
  assert.match(css, /scroll-snap-type:ymandatory;/);
  assert.match(css, /scroll-snap-align:start;/);
  assert.match(css, /height:100svh;margin-bottom:calc\(100lvh-100svh\);/);
  assert.match(css, /translate:0calc\(100dvh-100svh\);transition:translate0\.3sease;/);
  assert.doesNotMatch(css, /scroll-margin/);
  assert.doesNotMatch(css, /body::after/);
  assert.match(
    css,
    /display:block;position:absolute;inset:00auto;width:100%;height:calc\(50svh\+100dvh-100svh\);overflow:hidden;transition:height0\.3sease;/,
  );
  assert.doesNotMatch(css, /clip-path|transition:[^;}]*margin-bottom/);
  assert.doesNotMatch(css, /(?:margin-bottom:-10dvh|translate:010dvh|padding-bottom:10dvh)/);
});

test('homepage presentation selectors depend on options, not editorial section keys', () => {
  const css = compile('src/styles/homepage.scss').css;
  assert.doesNotMatch(css, /data-home-section\s*=/);
  for (const attribute of [
    'data-home-mobile-menu-tone',
    '--home-image-position',
    '--home-mobile-image-position',
    'data-arrow',
    'data-home-navigation-hidden',
    'data-hide-navigation',
  ]) {
    assert.ok(css.includes(attribute), `Missing presentation selector: ${attribute}`);
  }
});

test('unsupported responsive values fail explicitly', () => {
  for (const value of ['auto', '2rem', '-10px', '40']) {
    assert.throws(() => render(`font-size: ${value}`), /non-negative px values or zero/);
  }
});
