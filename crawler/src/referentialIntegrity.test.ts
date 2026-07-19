import assert from "node:assert/strict";
import test from "node:test";
import { checkReferentialIntegrity } from "../../scripts/check-referential-integrity.mjs";

test("checkReferentialIntegrity detects orphaned records without valid parent listing", () => {
  const listings = [{ id: "listing-1" }];
  const priceHistory = [
    { id: "ph-1", listing_id: "listing-1" },
    { id: "ph-2", listing_id: "orphaned-listing" },
  ];

  const result = checkReferentialIntegrity({ listings, priceHistory });
  assert.equal(result.valid, false);
  assert.equal(result.totalOrphans, 1);
  assert.equal(result.orphans.priceHistory.length, 1);
});
