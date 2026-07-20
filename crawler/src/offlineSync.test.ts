import test from 'node:test';
import assert from 'node:assert/strict';

interface MockItem {
  id: string;
  type: string;
  listingId: string;
  value: string;
}

function processQueue(items: MockItem[], processedIds: string[]): MockItem[] {
  return items.filter((item) => {
    if (processedIds.includes(item.id)) return false;
    return true;
  });
}

test('offline sync queue removes processed items', () => {
  const queue: MockItem[] = [
    { id: '1', type: 'status', listingId: 'l1', value: 'contacted' },
    { id: '2', type: 'notes', listingId: 'l2', value: 'some note' },
  ];

  const remaining = processQueue(queue, ['1']);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, '2');
});
