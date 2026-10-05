import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { assertOptimizedReference } from './image-assertions';
import { editorialSchemas } from '../src/lib/content/editorial';

const keys = [
  'greatness',
  'workshops',
  'personal',
  'changemaker',
  'nachhaltigkeit',
  'business',
  'management',
  'speaker',
];
test('homepage publishes all eight Markdoc sections with localized destinations and legacy fragments', async () => {
  const $ = load(await readFile('dist/index.html', 'utf8'));
  const legacy = load(await readFile('tests/fixtures/legacy/html/index.html', 'utf8'));
  assert.equal($('html').attr('lang'), 'de');
  assert.equal($('html').attr('data-page-kind'), 'home');
  assert.equal($('title').text(), legacy('head title').text());
  const normalize = (value: string) => value.replace(/\s+/g, '');
  assert.equal(
    normalize($('meta[name="description"]').attr('content')!),
    normalize(legacy('meta[name="description"]').attr('content')!),
  );
  assert.equal($('link[rel="canonical"]').attr('href'), 'https://susanne-preiss.de/');
  assert.equal($('[hreflang="en"]').length, 0);
  assert.deepEqual(
    $('.home-section[data-home-section]')
      .toArray()
      .map((el) => $(el).attr('data-home-section')),
    keys,
  );
  assert.equal(
    $('html').attr('data-home-section'),
    'greatness',
    'First-slide visibility is prerendered, not deferred until hydration',
  );
  assert.equal($('html').attr('data-home-tone'), 'dark');
  assert.equal(
    $('.site-header.light-controls').length,
    0,
    'No white toggle in the homepage HTML shell',
  );
  assert.equal($('main h1').length, 1);
  assert.equal($('.hero').length, 0);
  const images = $('.home-image img').toArray();
  assert.deepEqual(
    images.map((image) => $(image).attr('loading')),
    ['eager', 'eager', 'lazy', 'lazy', 'lazy', 'lazy', 'lazy', 'lazy'],
  );
  assert.deepEqual(
    images.map((image) => $(image).attr('fetchpriority')),
    ['high', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
  );
  legacy('#fullpage svg').remove();
  const visible = $('.homepage').clone();
  visible.find('[aria-hidden="true"]').remove();
  assert.equal(
    normalize(visible.text()),
    normalize(legacy('#fullpage').text().replaceAll('»', '')),
  );
  assert.deepEqual(
    $('.home-tile-link')
      .toArray()
      .map((el) => $(el).attr('href')),
    [
      '/workshops/',
      '/personalentwicklung/',
      '/regenerative-changemaker/',
      '/nachhaltigkeit/',
      '/business-coaching/',
      '/top-management-sparring/',
      '/key-note-speaker/',
    ],
  );
  for (const id of ['fullpage', 'regenerativeFrameWork', 'susannePreissCoaching'])
    assert.equal($(`[id="${id}"]`).length, 1);
  assert.equal($('.section-controls').attr('aria-label'), 'Abschnitte der Startseite');
  assert.deepEqual(
    $('.home-section[data-control-tone="light"]')
      .toArray()
      .map((el) => $(el).attr('data-home-section')),
    ['nachhaltigkeit', 'management'],
  );
  assertOptimizedReference(
    $('.home-tile source[media]').first().attr('srcset')?.split(' ')[0],
    '/img/susanne_preiss_web_head_01.jpg',
  );
  const noScript = load($('noscript').html() ?? '');
  assert.equal(noScript('.no-script-navigation a[href="/kontakt/"]').length, 1);
  assert.equal($('#footer-contact').attr('href'), '/kontakt/');
  assert.equal($('meta[http-equiv="refresh"]').length, 0);
  const alias = load(await readFile('dist/de/index.html', 'utf8'));
  assert.equal(alias('meta[http-equiv="refresh"]').attr('content'), '0;url=/');
});

test('homepage editorial tags reject arbitrary destinations, paths and unsupported tone', () => {
  const tile = {
    key: 'workshops',
    image: '/img/workshops_start.jpg',
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
