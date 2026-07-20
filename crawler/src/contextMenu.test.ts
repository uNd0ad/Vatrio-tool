import test from 'node:test';
import assert from 'node:assert/strict';

interface MenuState {
  x: number;
  y: number;
  listingId: string;
}

function computeMenuPosition(x: number, y: number, windowWidth = 1000, windowHeight = 800): { x: number; y: number } {
  const menuWidth = 200;
  const menuHeight = 260;

  const safeX = x + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : x;
  const safeY = y + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : y;

  return { x: Math.max(0, safeX), y: Math.max(0, safeY) };
}

test('computeMenuPosition keeps context menu within screen bounds', () => {
  assert.deepEqual(computeMenuPosition(100, 100), { x: 100, y: 100 });
  assert.deepEqual(computeMenuPosition(950, 750, 1000, 800), { x: 790, y: 530 });
});
