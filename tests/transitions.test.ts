import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compile } from 'sass';

const source = readFileSync('src/interactions/motion.ts', 'utf8');
const css = compile('src/styles/homepage.scss').css;

test('one shared module owns GSAP choreography and its dependency', () => {
  assert.match(source, /import \{ gsap \} from 'gsap'/);
  assert.match(source, /export function createMenuMotion/);
  assert.match(source, /export function createPageMotion/);
  for (const file of ['src/components/Navigation.svelte', 'src/interactions/navigation.ts']) {
    const caller = readFileSync(file, 'utf8');
    assert.match(caller, /from ['"].*\/motion['"]/);
    assert.doesNotMatch(
      caller,
      /from ['"]gsap['"]|gsap\.|waitForMotion|data-page-motion|data-menu-state/,
    );
  }
  assert.equal(JSON.parse(readFileSync('package.json', 'utf8')).dependencies.gsap, '3.15.0');
  assert.match(readFileSync('pnpm-lock.yaml', 'utf8'), /gsap@3\.15\.0/);
});

test('menu and controls offsets do not replace viewport translation or centering', () => {
  assert.match(css, /transform: translateY\(var\(--menu-panel-y, 0px\)\)/);
  assert.match(css, /transform: translateX\(var\(--controls-motion-x, 0px\)\)/);
  assert.match(css, /translate: 0 10dvh/);
  assert.match(css, /translate: 0 -50%/);
  assert.match(source, /node\.dataset\.homeSection === options\.sectionKey/);
  assert.match(source, /tween\(timeline, section, '\.home-image'/);
  assert.match(source, /tween\(timeline, section, '\.home-copy'/);
});

test('GSAP supplies reversal and style cleanup rather than a replacement animation engine', () => {
  assert.match(source, /timeline\.reverse\(\)/);
  assert.match(source, /context\.revert\(\)/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /removeEventListener\('change'/);
  assert.doesNotMatch(
    source,
    /requestAnimationFrame|setInterval|CSSTransition|MotionStep|CssTrack/,
  );
});
