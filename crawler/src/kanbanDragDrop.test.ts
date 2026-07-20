import test from 'node:test';
import assert from 'node:assert/strict';

interface MockListing {
  id: string;
  status: string;
}

function handleKanbanDrop(listings: MockListing[], listingId: string, targetStatus: string): MockListing[] {
  return listings.map((l) => (l.id === listingId ? { ...l, status: targetStatus } : l));
}

test('handleKanbanDrop updates target listing status correctly', () => {
  const listings: MockListing[] = [
    { id: '1', status: 'new' },
    { id: '2', status: 'contacted' },
  ];

  const updated = handleKanbanDrop(listings, '1', 'closed');
  assert.equal(updated.find((l) => l.id === '1')?.status, 'closed');
  assert.equal(updated.find((l) => l.id === '2')?.status, 'contacted');
});
