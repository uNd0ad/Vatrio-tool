import test from "node:test";
import assert from "node:assert/strict";
import { hasPriceChanged } from "./priceHistory";

test("hasPriceChanged detects a price change", () => {
  assert.equal(hasPriceChanged({ price: 100000, currency: "EUR" }, { price: 95000, currency: "EUR" }), true);
});

test("hasPriceChanged detects a currency change at same amount", () => {
  assert.equal(hasPriceChanged({ price: 100000, currency: "EUR" }, { price: 100000, currency: "RON" }), true);
});

test("hasPriceChanged ignores identical price and currency", () => {
  assert.equal(hasPriceChanged({ price: 100000, currency: "EUR" }, { price: 100000, currency: "EUR" }), false);
});

test("hasPriceChanged treats null price transitions as changes", () => {
  assert.equal(hasPriceChanged({ price: null, currency: "EUR" }, { price: 90000, currency: "EUR" }), true);
  assert.equal(hasPriceChanged({ price: null, currency: null }, { price: null, currency: null }), false);
});
