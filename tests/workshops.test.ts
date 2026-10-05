import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editorialSchemas } from '../src/lib/content/editorial';

test('resource/media attributes reject incomplete layouts and unsafe destinations', () => {
  const base = { key: 'resource-1', destination: '/pdf/fixture-course.pdf' };
  assert.ok(editorialSchemas.resource.safeParse(base).success);
  for (const destination of [
    'javascript:alert(1)',
    '//external.test/a',
    '/pdf/../private.pdf',
    '/de/missing/',
  ])
    assert.equal(editorialSchemas.resource.safeParse({ ...base, destination }).success, false);
  assert.equal(
    editorialSchemas.resource.safeParse({ ...base, destination: undefined }).success,
    false,
  );
  assert.equal(editorialSchemas.course.safeParse(base).success, false);
  assert.equal(editorialSchemas.prose.safeParse(base).success, false);
  assert.ok(
    editorialSchemas.course.safeParse({ ...base, image: '/img/fixture.jpg', alt: '', side: 'left' })
      .success,
  );
});
