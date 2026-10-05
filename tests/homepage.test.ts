import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editorialSchemas } from '../src/lib/content/editorial';

test('intro and tile positions accept standard CSS keywords, lengths, percentages and math', () => {
  for (const position of [
    'bottom',
    'left center',
    'right bottom',
    '30% 70%',
    '-10px 5rem',
    'right 12px top 20%',
    'calc(50% - 10px) 25%',
    'clamp(10px, 30%, 50px) top',
  ]) {
    for (const tag of ['home-intro', 'home-tile'] as const) {
      const result = editorialSchemas[tag].safeParse({
        key: 'any-section',
        image: '/img/fixture.jpg',
        alt: '',
        ...(tag === 'home-tile' ? { destination: 'content:workshops' } : {}),
        imagePosition: position,
        mobileImagePosition: position,
      });
      assert.equal(result.success, true, `${tag}: ${position}`);
    }
  }
});

test('homepage editorial tags reject arbitrary destinations, paths and unsupported tone', () => {
  const tile = {
    key: 'fixture-tile',
    image: '/img/fixture.jpg',
    alt: '',
    destination: 'content:workshops',
  };
  const defaults = editorialSchemas['home-tile'].parse(tile);
  assert.equal(defaults.tone, 'dark');
  assert.equal(defaults.mobileMenuTone, undefined);
  assert.equal(defaults.imagePosition, 'center top');
  assert.equal(defaults.mobileImagePosition, undefined);
  assert.equal(defaults.arrow, 'below');
  assert.equal(defaults.hideNavigation, false);
  for (const hideNavigation of [false, true]) {
    assert.equal(
      editorialSchemas['home-tile'].parse({ ...tile, hideNavigation }).hideNavigation,
      hideNavigation,
    );
    assert.equal(
      editorialSchemas['home-intro'].parse({
        key: tile.key,
        image: tile.image,
        alt: '',
        hideNavigation,
      }).hideNavigation,
      hideNavigation,
    );
  }
  for (const key of ['new-section', 'renamed-section']) {
    const authored = editorialSchemas['home-tile'].parse({
      ...tile,
      key,
      tone: 'light',
      mobileMenuTone: 'dark',
      imagePosition: 'center',
      arrow: 'inline',
    });
    assert.equal(authored.mobileMenuTone, 'dark');
    assert.equal(authored.imagePosition, 'center');
    assert.equal(authored.arrow, 'inline');
  }
  for (const invalid of [
    { destination: '/html/workshops.html' },
    { image: '/img/../secret.jpg' },
    { tone: 'white' },
    { mobileMenuTone: 'white' },
    { imagePosition: 'arbitrary-css' },
    { mobileImagePosition: 'left left' },
    { imagePosition: 'center; color: red' },
    { imagePosition: 'url(https://example.com)' },
    { imagePosition: 'calc(nonsense)' },
    { imagePosition: 'calc(1px + )' },
    { imagePosition: 'var(--unavailable)' },
    { imagePosition: 'inherit' },
    { imagePosition: '' },
    { arrow: 'custom' },
    { hideNavigation: 'true' },
    { side: 'center' },
    { class: 'arbitrary' },
  ]) {
    assert.equal(editorialSchemas['home-tile'].safeParse({ ...tile, ...invalid }).success, false);
  }
});
