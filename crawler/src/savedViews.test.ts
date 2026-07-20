import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultSavedViews, saveView, deleteSavedView } from '../../src/utils/savedViews.js';

test('savedViews manages perspectives correctly', () => {
  const defaults = getDefaultSavedViews();
  assert.ok(defaults.length >= 3);
  assert.equal(defaults[0].name, 'Timișoara Studios Under 60k');
});
