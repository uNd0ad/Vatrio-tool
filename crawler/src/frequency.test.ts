import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
const { isSiteDue, parseSiteIntervals } = await import("./frequency");

test("parses per-site crawl intervals", () => {
  assert.deepEqual(parseSiteIntervals("olx:60, storia:120"), { olx: 60, storia: 120 });
  assert.throws(() => parseSiteIntervals("unknown:5"), /Invalid site interval/);
});

test("determines whether a site is due", () => {
  const now = Date.parse("2026-07-19T12:00:00Z");
  assert.equal(isSiteDue("2026-07-19T10:59:59Z", 60, now), true);
  assert.equal(isSiteDue("2026-07-19T11:30:00Z", 60, now), false);
  assert.equal(isSiteDue(null, 60, now), true);
});
