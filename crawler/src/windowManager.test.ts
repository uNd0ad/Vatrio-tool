import test from 'node:test';
import assert from 'node:assert/strict';

function sanitizeWindowLabel(listingId: string): string {
  return `listing_${listingId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

test('sanitizeWindowLabel generates safe identifier for webview windows', () => {
  assert.equal(sanitizeWindowLabel('listing-123-abc'), 'listing_listing-123-abc');
  assert.equal(sanitizeWindowLabel('id@with!special#chars'), 'listing_idwithspecialchars');
});
