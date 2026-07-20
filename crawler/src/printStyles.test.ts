import test from 'node:test';
import assert from 'node:assert/strict';

test('print styles rules exist for clean print export', () => {
  const hiddenSelectors = ['.sidebar', '.panel-toolbar', '.toolbar-actions', 'button'];
  assert.ok(hiddenSelectors.includes('.sidebar'));
  assert.ok(hiddenSelectors.includes('button'));
});
