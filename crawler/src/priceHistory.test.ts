import assert from "node:assert/strict";
import test from "node:test";
import { hasPriceChanged } from "./priceHistory";

test("detects price and currency changes without treating equal values as changes", () => {
  assert.equal(hasPriceChanged({ price: 90000, currency: "EUR" }, { price: 90000, currency: "EUR" }), false);
  assert.equal(hasPriceChanged({ price: 90000, currency: "EUR" }, { price: 87500, currency: "EUR" }), true);
  assert.equal(hasPriceChanged({ price: 90000, currency: "EUR" }, { price: 90000, currency: "RON" }), true);
  assert.equal(hasPriceChanged({ price: null, currency: null }, { price: 500, currency: "EUR" }), true);
});
