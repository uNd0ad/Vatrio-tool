import test from 'node:test';
import assert from 'node:assert/strict';

export function calculatePricePerSqm(price: number | null, sqm: number | null): number | null {
  if (price === null || sqm === null || sqm <= 0 || price <= 0) {
    return null;
  }
  return Math.round(price / sqm);
}

export function formatPricePerSqm(
  price: number | null,
  sqm: number | null,
  currency: string | null = 'EUR'
): string {
  const rate = calculatePricePerSqm(price, sqm);
  if (rate === null) return '';
  const curr = currency ?? 'EUR';
  return `${new Intl.NumberFormat('ro-RO').format(rate)} ${curr}/m²`;
}

test('calculatePricePerSqm auto-calculates correct rate', () => {
  assert.equal(calculatePricePerSqm(100000, 50), 2000);
  assert.equal(calculatePricePerSqm(75000, 60), 1250);
});

test('calculatePricePerSqm returns null for invalid inputs', () => {
  assert.equal(calculatePricePerSqm(null, 50), null);
  assert.equal(calculatePricePerSqm(100000, null), null);
  assert.equal(calculatePricePerSqm(0, 50), null);
  assert.equal(calculatePricePerSqm(100000, 0), null);
});

test('formatPricePerSqm formats rate string properly', () => {
  assert.equal(formatPricePerSqm(100000, 50, 'EUR'), '2.000 EUR/m²');
  assert.equal(formatPricePerSqm(null, 50), '');
});
