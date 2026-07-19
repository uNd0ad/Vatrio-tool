import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
const { isQueueMode } = await import("./queue");

test("queue mode is explicitly opt-in", () => {
  assert.equal(isQueueMode("true"), true);
  assert.equal(isQueueMode("1"), true);
  assert.equal(isQueueMode("false"), false);
  assert.equal(isQueueMode(undefined), false);
});
