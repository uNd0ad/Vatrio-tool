import test from 'node:test';
import assert from 'node:assert/strict';

function generateSkeletonRows(count: number = 8): number[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => i);
}

test('generateSkeletonRows outputs expected row count', () => {
  assert.equal(generateSkeletonRows(8).length, 8);
  assert.equal(generateSkeletonRows(5).length, 5);
  assert.equal(generateSkeletonRows(0).length, 1);
});
