import test from 'node:test';
import assert from 'node:assert/strict';

interface MockWindowState {
  width: number;
  height: number;
}

function updateWindowState(current: MockWindowState, width: number, height: number): MockWindowState {
  return { ...current, width: Math.max(800, width), height: Math.max(600, height) };
}

test('updateWindowState enforces minimum dimensions', () => {
  const initial = { width: 1280, height: 800 };
  const updated = updateWindowState(initial, 500, 400);

  assert.equal(updated.width, 800);
  assert.equal(updated.height, 600);
});
