import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextFocusedRowIndex } from '../../src/utils/tableKeyboardNav.js';

test('getNextFocusedRowIndex moves focus within row bounds', () => {
  assert.equal(getNextFocusedRowIndex(0, 10, 'ArrowDown'), 1);
  assert.equal(getNextFocusedRowIndex(9, 10, 'ArrowDown'), 9);
  assert.equal(getNextFocusedRowIndex(5, 10, 'ArrowUp'), 4);
  assert.equal(getNextFocusedRowIndex(0, 10, 'ArrowUp'), 0);
  assert.equal(getNextFocusedRowIndex(-1, 10, 'ArrowDown'), 0);
});
