import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_CHANGELOG } from '../../src/components/ChangelogModal.js';

test('APP_CHANGELOG contains release notes for current version', () => {
  assert.ok(APP_CHANGELOG.length > 0);
  assert.equal(APP_CHANGELOG[0].version, '1.4.0');
  assert.ok(APP_CHANGELOG[0].changes.length >= 5);
});
