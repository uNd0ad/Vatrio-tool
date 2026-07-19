import assert from "node:assert/strict";
import test from "node:test";
import { classifySellerType } from "./sellerType";

test("classifies Romanian seller signals with and without diacritics", () => {
  assert.equal(classifySellerType("Vând direct, persoană fizică"), "owner");
  assert.equal(classifySellerType("Ofertă de la agenție, comision 2%"), "agency");
  assert.equal(classifySellerType("Direct de la dezvoltator"), "developer");
  assert.equal(classifySellerType("Apartament luminos"), "unknown");
});
