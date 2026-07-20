import test from 'node:test';
import assert from 'node:assert/strict';

interface SimpleListing {
  id: string;
  title: string;
  price: number | null;
}

function filterComparisonListings(allListings: SimpleListing[], selectedIds: string[]): SimpleListing[] {
  const selectedSet = new Set(selectedIds);
  return allListings.filter((l) => selectedSet.has(l.id)).slice(0, 3);
}

test('filterComparisonListings extracts up to 3 selected listings', () => {
  const listings: SimpleListing[] = [
    { id: '1', title: 'Listing 1', price: 100000 },
    { id: '2', title: 'Listing 2', price: 120000 },
    { id: '3', title: 'Listing 3', price: 90000 },
    { id: '4', title: 'Listing 4', price: 110000 },
  ];

  const result = filterComparisonListings(listings, ['1', '3', '4']);
  assert.equal(result.length, 3);
  assert.equal(result[0].id, '1');
  assert.equal(result[1].id, '3');
  assert.equal(result[2].id, '4');
});
