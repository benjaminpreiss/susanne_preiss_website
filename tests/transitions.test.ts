import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motionSteps } from '../src/interactions/page-motion';

test('content exits left, utilities fade, and content returns from the left', () => {
  assert.deepEqual(motionSteps('content', 'exit', false)[0]?.pose, { opacity: 0, xPercent: -100 });
  assert.deepEqual(motionSteps('utility', 'entry', false)[0]?.pose, { opacity: 0 });
  assert.deepEqual(motionSteps('utility', 'exit', false)[0]?.pose, { opacity: 0 });
  assert.deepEqual(motionSteps('content', 'entry', false, false, true)[0]?.pose, {
    opacity: 0,
    xPercent: -100,
  });
});
test('desktop header exits sideways, touch toggle fades, and footer exits downwards', () => {
  const desktop = motionSteps('content', 'exit', false);
  const mobile = motionSteps('content', 'exit', true);
  assert.deepEqual(desktop.find((step) => step.selector === '#menu-trigger')?.pose, {
    xPercent: 300,
  });
  assert.deepEqual(mobile.find((step) => step.selector === '#menu-trigger')?.pose, { opacity: 0 });
  assert.deepEqual(mobile.find((step) => step.selector === '.site-header .home')?.pose, {
    xPercent: -300,
  });
  assert.deepEqual(desktop.find((step) => step.selector === '#footer-contact')?.pose, {
    yPercent: 200,
  });
  assert.equal(Math.max(...desktop.map((step) => step.duration)), 0.5);
});
test('menu departure does not compete with its existing content/footer transforms', () => {
  assert.deepEqual(
    motionSteps('content', 'exit', false, true).map((step) => step.selector),
    ['dialog[open] .main-navigation', 'dialog[open] .dismiss-menu'],
  );
});
test('homepage splits desktop panels including content; portrait exits upwards as one surface', () => {
  for (const phase of ['exit', 'entry'] as const) {
    const desktop = motionSteps('home', phase, false);
    assert.deepEqual(
      desktop.slice(0, 4).map((step) => [step.selector, step.pose.xPercent, step.duration]),
      [
        ['.home-image.home-left', -100, 0.5],
        ['.home-image.home-right', 100, 0.5],
        ['.home-copy.home-left', -100, 0.7],
        ['.home-copy.home-right', 100, 0.7],
      ],
    );
    const portrait = motionSteps('home', phase, true);
    assert.deepEqual(portrait[0], {
      selector: '.homepage',
      pose: { y: '-100vh', opacity: 0 },
      duration: 0.7,
    });
    for (const steps of [desktop, portrait]) {
      assert.equal(
        steps.some((step) => step.selector === 'main.content'),
        false,
      );
      assert.deepEqual(steps.find((step) => step.selector === '#menu-trigger')?.pose, {
        xPercent: 300,
        color: '#2b2c36',
      });
      assert.deepEqual(steps.find((step) => step.selector === '.section-controls')?.pose, {
        xPercent: 300,
        color: '#333',
      });
    }
  }
  assert.deepEqual(
    motionSteps('home', 'exit', false, true).map((step) => step.selector),
    ['dialog[open] .main-navigation', 'dialog[open] .dismiss-menu'],
  );
  assert.deepEqual(motionSteps('home', 'exit', true, true)[1]?.pose, { xPercent: 300 });
});
