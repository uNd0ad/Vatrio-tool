import test from 'node:test';
import assert from 'node:assert/strict';

export interface VirtualizerOptions {
  totalItems: number;
  itemHeight: number;
  scrollTop: number;
  containerHeight: number;
  overscan?: number;
}

export function getVirtualSlice({
  totalItems,
  itemHeight,
  scrollTop,
  containerHeight,
  overscan = 5,
}: VirtualizerOptions) {
  if (totalItems <= 0 || itemHeight <= 0) {
    return { startIndex: 0, endIndex: 0, topPadding: 0, bottomPadding: 0 };
  }

  const safeScrollTop = Math.max(0, scrollTop);
  const safeContainerHeight = Math.max(0, containerHeight);

  const rawStart = Math.floor(safeScrollTop / itemHeight);
  const visibleCount = Math.ceil(safeContainerHeight / itemHeight);

  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex = Math.min(totalItems, rawStart + visibleCount + overscan);

  const topPadding = startIndex * itemHeight;
  const bottomPadding = (totalItems - endIndex) * itemHeight;

  return {
    startIndex,
    endIndex,
    topPadding,
    bottomPadding,
  };
}

test('virtualizer calculates slice for empty list', () => {
  const result = getVirtualSlice({
    totalItems: 0,
    itemHeight: 50,
    scrollTop: 0,
    containerHeight: 500,
  });
  assert.equal(result.startIndex, 0);
  assert.equal(result.endIndex, 0);
  assert.equal(result.topPadding, 0);
  assert.equal(result.bottomPadding, 0);
});

test('virtualizer calculates slice at top of scroll', () => {
  const result = getVirtualSlice({
    totalItems: 1000,
    itemHeight: 50,
    scrollTop: 0,
    containerHeight: 500, // 10 items visible
    overscan: 2,
  });
  assert.equal(result.startIndex, 0);
  assert.equal(result.endIndex, 12); // 10 visible + 2 overscan
  assert.equal(result.topPadding, 0);
  assert.equal(result.bottomPadding, (1000 - 12) * 50);
});

test('virtualizer calculates slice in middle of scroll', () => {
  const result = getVirtualSlice({
    totalItems: 1000,
    itemHeight: 50,
    scrollTop: 1000, // item index 20
    containerHeight: 500, // 10 items visible
    overscan: 2,
  });
  assert.equal(result.startIndex, 18); // 20 - 2
  assert.equal(result.endIndex, 32); // 20 + 10 + 2
  assert.equal(result.topPadding, 18 * 50);
  assert.equal(result.bottomPadding, (1000 - 32) * 50);
});
