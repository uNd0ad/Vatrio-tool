import test from 'node:test';
import assert from 'node:assert/strict';

interface MockListing {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
}

function filterMapListings(listings: MockListing[], zone: string): MockListing[] {
  return listings.filter((l) => {
    const matches = zone === 'all' || (l.location && l.location.toLowerCase().includes(zone.toLowerCase()));
    return matches && (l.latitude != null || l.location != null);
  });
}

test('filterMapListings returns mapped listings correctly', () => {
  const list: MockListing[] = [
    { id: '1', location: 'Cluj-Napoca, Centru', latitude: 46.77, longitude: 23.6 },
    { id: '2', location: 'București, Sector 1', latitude: 44.43, longitude: 26.1 },
  ];

  assert.equal(filterMapListings(list, 'all').length, 2);
  assert.equal(filterMapListings(list, 'Cluj').length, 1);
  assert.equal(filterMapListings(list, 'Timișoara').length, 0);
});
