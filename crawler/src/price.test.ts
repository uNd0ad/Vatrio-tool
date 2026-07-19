import assert from "node:assert/strict";
import test from "node:test";
import { inferCurrency, parsePrice } from "./price";

test("normalizes Romanian and international price formats", () => {
  assert.equal(parsePrice("125.000 €"), 125000);
  assert.equal(parsePrice("125,000 EUR"), 125000);
  assert.equal(parsePrice("1 250,50 lei"), 1250.5);
  assert.equal(parsePrice("Preț la cerere"), null);
});

test("normalizes currency labels", () => {
  assert.equal(inferCurrency("90 000 €"), "EUR");
  assert.equal(inferCurrency("450000 RON"), "RON");
  assert.equal(inferCurrency("2 500 lei"), "RON");
  assert.equal(inferCurrency("negociabil"), null);
});
