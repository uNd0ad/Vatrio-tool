import assert from "node:assert/strict";
import test from "node:test";
import { isPromotedListing } from "./promoted";

test("recognizes Romanian and English promoted-card labels", () => {
  assert.equal(isPromotedListing("PROMOVAT Apartament cu 2 camere"), true);
  assert.equal(isPromotedListing("Anunț sponsorizat"), true);
  assert.equal(isPromotedListing("Sponsored listing"), true);
  assert.equal(isPromotedListing("Anunț premium · Casă de vânzare"), true);
  assert.equal(isPromotedListing("Apartament renovat de vânzare"), false);
});
