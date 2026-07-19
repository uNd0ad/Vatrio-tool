import assert from "node:assert/strict";
import test from "node:test";
import { auditListingQuality } from "./dataQualityReport.ts";

test("auditListingQuality flags missing location, surface, external ID, and price out of bounds", () => {
  const invalidListing = {
    id: "lst-1",
    url: "https://example.com/item/1",
    location: "",
    surface_sqm: 0,
    price: 15_000_000,
    external_id: "",
  };

  const issues = auditListingQuality(invalidListing);
  assert.equal(issues.length, 4);
  assert.deepEqual(issues.map((i) => i.rule), ["missing_location", "missing_surface", "invalid_price", "missing_external_id"]);
});
