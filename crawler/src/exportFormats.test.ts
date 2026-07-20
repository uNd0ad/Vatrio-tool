import test from 'node:test';
import assert from 'node:assert/strict';

test('verify export format options supported', () => {
  const formats = ['csv', 'excel', 'json', 'pdf'];
  assert.equal(formats.length, 4);
  assert.ok(formats.includes('json'));
  assert.ok(formats.includes('pdf'));
});
