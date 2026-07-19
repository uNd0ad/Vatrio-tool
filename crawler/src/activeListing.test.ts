import assert from "node:assert/strict";
import test from "node:test";
import { isActiveListing } from "../../src/utils/activeListing";

test("treats only listings without a deletion timestamp as active", () => {
  assert.equal(isActiveListing({}), true);
  assert.equal(isActiveListing({ deleted_at: null }), true);
  assert.equal(isActiveListing({ deleted_at: "2026-07-19T12:00:00.000Z" }), false);
});
