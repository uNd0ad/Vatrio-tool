import test from 'node:test';
import assert from 'node:assert/strict';

function calculateNewTodayCount(listings: Array<{ date_scraped: string }>, nowMs: number = Date.now()): number {
  const cutoff = nowMs - 24 * 60 * 60 * 1000;
  return listings.filter((l) => new Date(l.date_scraped).getTime() >= cutoff).length;
}

test('calculateNewTodayCount identifies listings added within 24h', () => {
  const now = Date.now();
  const listings = [
    { date_scraped: new Date(now - 2 * 60 * 60 * 1000).toISOString() }, // 2h ago
    { date_scraped: new Date(now - 10 * 60 * 60 * 1000).toISOString() }, // 10h ago
    { date_scraped: new Date(now - 48 * 60 * 60 * 1000).toISOString() }, // 2 days ago
  ];

  assert.equal(calculateNewTodayCount(listings, now), 2);
});
