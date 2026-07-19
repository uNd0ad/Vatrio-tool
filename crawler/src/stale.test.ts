import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
const { staleCutoff } = await import("./stale");

test("calculates an ISO stale cutoff from whole days", () => {
  const now = Date.parse("2026-07-31T12:00:00Z");
  assert.equal(staleCutoff(30, now), "2026-07-01T12:00:00.000Z");
  assert.throws(() => staleCutoff(0, now), RangeError);
});
