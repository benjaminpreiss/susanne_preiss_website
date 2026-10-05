import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath, pageOutput, validateOutputClaims } from '../src/lib/content/paths';

test('authored paths cover root, optional locale prefixes, and nested translated paths', () => {
  for (const [input, expected] of [
    ['/', '/'],
    ['/en/', '/en/'],
    ['/kontakt', '/kontakt/'],
    ['/contact/', '/contact/'],
    ['/regenerative-changemaker', '/regenerative-changemaker/'],
    ['/en/regenerative-changemaker', '/en/regenerative-changemaker/'],
    ['/angebote/coaching-2026', '/angebote/coaching-2026/'],
  ]) {
    assert.equal(normalizePath(input!), expected);
    assert.equal(normalizePath(normalizePath(input!)), expected);
  }
});

test('unsafe or ambiguous authored paths fail without decoding or silently repairing them', () => {
  for (const path of [
    '',
    'contact',
    'https://example.com/contact',
    '//example.com',
    '//',
    '/contact?x=1',
    '/contact#section',
    '/a/../b',
    '/a/./b',
    '/a//b',
    '/a%2fb',
    '/a%2Fb',
    '/a%5cb',
    '/%2e%2e',
    '/%252f',
    '/a\\b',
    '/Contact',
    '/über-mich',
    '/a_b',
    '/a.b',
    '/-a',
    '/a-',
    '/a--b',
    ' /contact',
    '/contact ',
    '/a\n',
    '/a\t',
    '/a\0',
    '/index.html',
  ])
    assert.throws(() => normalizePath(path), /Invalid authored path/, path);
});

test('directory-index outputs normalize authoring slash variants once', () => {
  assert.equal(pageOutput('/'), 'index.html');
  assert.equal(pageOutput('/kontakt'), 'kontakt/index.html');
  assert.equal(pageOutput('/kontakt/'), 'kontakt/index.html');
  assert.equal(pageOutput('/en/contact'), 'en/contact/index.html');
});

test('output collisions include canonical, draft, alias, fixed-page and public-asset claims', () => {
  for (const owner of ['draft:en', 'alias:/de/contact/', 'fixed-page', 'public-asset']) {
    assert.throws(
      () =>
        validateOutputClaims([
          { file: pageOutput('/contact'), owner: 'published:de' },
          { file: 'contact/index.html', owner },
        ]),
      /Duplicate output: contact\/index.html/,
    );
  }
  assert.throws(
    () =>
      validateOutputClaims([
        { file: pageOutput('/'), owner: 'home' },
        { file: 'index.html', owner: 'obsolete root alias' },
      ]),
    /Duplicate output/,
  );
});

test('public files cannot become route directories, independent of claim order', () => {
  const claims = [
    { file: 'angebote', owner: 'public asset' },
    { file: pageOutput('/angebote/coaching'), owner: 'page' },
  ];
  assert.throws(() => validateOutputClaims(claims), /file\/directory conflict/);
  assert.throws(() => validateOutputClaims([...claims].reverse()), /file\/directory conflict/);
  assert.doesNotThrow(() =>
    validateOutputClaims([
      { file: pageOutput('/'), owner: 'home' },
      { file: pageOutput('/angebote'), owner: 'parent page' },
      { file: pageOutput('/angebote/coaching'), owner: 'child page' },
      { file: 'angebote/image.jpg', owner: 'public image' },
      { file: '404.html', owner: 'fixed page' },
    ]),
  );
});
