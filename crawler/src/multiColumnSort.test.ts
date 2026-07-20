import test from 'node:test';
import assert from 'node:assert/strict';
import { sortListingsMultiColumn, SortRule } from '../../src/utils/multiColumnSort.js';

test('sortListingsMultiColumn sorts by primary then secondary fields', () => {
  const listings: any[] = [
    { id: '1', price: 100000, date_scraped: '2026-05-01' },
    { id: '2', price: 100000, date_scraped: '2026-05-10' },
    { id: '3', price: 80000, date_scraped: '2026-05-05' },
  ];

  const rules: SortRule[] = [
    { field: 'price', direction: 'asc' },
    { field: 'date_scraped', direction: 'desc' },
  ];

  const sorted = sortListingsMultiColumn(listings, rules);
  assert.equal(sorted[0].id, '3'); // price 80000
  assert.equal(sorted[1].id, '2'); // price 100000, date May 10
  assert.equal(sorted[2].id, '1'); // price 100000, date May 1
});
