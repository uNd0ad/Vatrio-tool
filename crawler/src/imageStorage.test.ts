import assert from "node:assert/strict";
import test from "node:test";
import { isValidListingImage, listingImageObjectPath, MAX_LISTING_IMAGE_BYTES } from "./imageStorage";

test("builds stable content-type-aware listing image paths", () => {
  const first = listingImageObjectPath("https://example.test/listing/42", "image/jpeg");
  const second = listingImageObjectPath("https://example.test/listing/42", "image/jpeg");
  assert.equal(first, second);
  assert.match(first ?? "", /^[a-f0-9]{2}\/[a-f0-9]{64}\.jpg$/);
  assert.equal(listingImageObjectPath("https://example.test/listing/42", "text/html"), null);
});

test("accepts supported images only within the storage size limit", () => {
  assert.equal(isValidListingImage("image/webp", 1024), true);
  assert.equal(isValidListingImage("image/svg+xml", 1024), false);
  assert.equal(isValidListingImage("image/png", MAX_LISTING_IMAGE_BYTES + 1), false);
  assert.equal(isValidListingImage("image/png", 0), false);
});
