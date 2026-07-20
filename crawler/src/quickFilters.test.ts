import test from 'node:test';
import assert from 'node:assert/strict';
import { applyQuickFilter } from '../../src/utils/quickFilters.js';

test('applyQuickFilter filters by price dropped and below average correctly', () => {
  const listings: any[] = [
    { id: '1', price: 100000, surface_sqm: 50, price_history: [{ price: 110000, date: '2026-05-01' }, { price: 100000, date: '2026-05-05' }] }, // 2000 €/m²
    { id: '2', price: 200000, surface_sqm: 50 }, // 4000 €/m²
  ];

  const dropped = applyQuickFilter(listings, 'price_dropped');
  assert.equal(dropped.length, 1);
  assert.equal(dropped[0].id, '1');

  const belowAvg = applyQuickFilter(listings, 'below_average');
  assert.equal(belowAvg.length, 1);
  assert.equal(belowAvg[0].id, '1');
});
