import test from 'node:test';
import assert from 'node:assert/strict';

interface PriceItem {
  price: number;
  date: string;
}

function calculatePriceDiff(oldPrice: number, newPrice: number): { diff: number; percent: string; isDrop: boolean } {
  const diff = newPrice - oldPrice;
  const percent = ((diff / oldPrice) * 100).toFixed(1);
  return { diff, percent, isDrop: diff < 0 };
}

test('calculatePriceDiff calculates price drop percentage correctly', () => {
  const result = calculatePriceDiff(100000, 95000);
  assert.equal(result.diff, -5000);
  assert.equal(result.percent, '-5.0');
  assert.equal(result.isDrop, true);
});
