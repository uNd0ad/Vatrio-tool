import test from 'node:test';
import assert from 'node:assert/strict';

interface MockListing {
  id: string;
  title: string;
}

function filterFavorites(listings: MockListing[], starredIds: Set<string>): MockListing[] {
  return listings.filter((l) => starredIds.has(l.id));
}

test('filterFavorites filters starred items correctly', () => {
  const list: MockListing[] = [
    { id: '1', title: 'Proprietate A' },
    { id: '2', title: 'Proprietate B' },
  ];
  const starred = new Set(['1']);

  const favs = filterFavorites(list, starred);
  assert.equal(favs.length, 1);
  assert.equal(favs[0].id, '1');
});
