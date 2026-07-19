import assert from "node:assert/strict";
import test from "node:test";
import { resolveNextPageUrl } from "./pagination";

test("resolves relative next pages and prevents pagination cycles", () => {
  const current = "https://example.test/search?page=1";
  assert.equal(resolveNextPageUrl("?page=2", current, new Set([current])), "https://example.test/search?page=2");
  assert.equal(resolveNextPageUrl(current, current, new Set([current])), null);
  assert.equal(resolveNextPageUrl(null, current, new Set()), null);
});
