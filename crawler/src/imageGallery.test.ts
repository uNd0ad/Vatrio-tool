import test from 'node:test';
import assert from 'node:assert/strict';

function deduplicateImages(primaryImageUrl?: string | null, images?: string[] | null): string[] {
  const list: string[] = [];
  if (primaryImageUrl?.trim()) list.push(primaryImageUrl.trim());
  if (images && Array.isArray(images)) {
    for (const img of images) {
      if (img?.trim() && !list.includes(img.trim())) {
        list.push(img.trim());
      }
    }
  }
  return list;
}

test('deduplicateImages combines primary and additional images correctly', () => {
  const result = deduplicateImages('https://example.com/1.jpg', [
    'https://example.com/1.jpg',
    'https://example.com/2.jpg',
    'https://example.com/3.jpg',
  ]);
  assert.deepEqual(result, [
    'https://example.com/1.jpg',
    'https://example.com/2.jpg',
    'https://example.com/3.jpg',
  ]);
});

test('deduplicateImages handles empty/null inputs', () => {
  assert.deepEqual(deduplicateImages(null, null), []);
  assert.deepEqual(deduplicateImages('  ', []), []);
  assert.deepEqual(deduplicateImages('https://example.com/img.jpg', null), ['https://example.com/img.jpg']);
});
