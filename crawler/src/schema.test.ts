import assert from "node:assert/strict";
import test from "node:test";
import { SCRAPED_DATA_SCHEMA_VERSION, versionScrapedData } from "./schema";

test("adds the current schema version without mutating scraped data", () => {
  const listing = { title: "Apartament" };
  const versioned = versionScrapedData(listing);
  assert.equal(versioned.schema_version, SCRAPED_DATA_SCHEMA_VERSION);
  assert.deepEqual(listing, { title: "Apartament" });
});
