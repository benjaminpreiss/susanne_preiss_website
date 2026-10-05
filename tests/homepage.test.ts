import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editorialSchemas } from '../src/lib/content/editorial';

test('homepage editorial tags reject arbitrary destinations, paths and unsupported tone', () => {
  const tile = {
    key: 'fixture-tile',
    image: '/img/fixture.jpg',
    alt: '',
    destination: 'content:workshops',
  };
  assert.equal(editorialSchemas['home-tile'].safeParse(tile).success, true);
  for (const invalid of [
    { destination: '/html/workshops.html' },
    { image: '/img/../secret.jpg' },
    { tone: 'white' },
    { side: 'center' },
    { class: 'arbitrary' },
  ]) {
    assert.equal(editorialSchemas['home-tile'].safeParse({ ...tile, ...invalid }).success, false);
  }
});
