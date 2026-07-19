import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { convertCurrency, inferCurrency, normalizeCurrency } from "./price";

test("inferCurrency recognizes EUR, RON, USD, and GBP symbols and keywords", () => {
  assert.equal(inferCurrency("150.000 €"), "EUR");
  assert.equal(inferCurrency("250.000 lei"), "RON");
  assert.equal(inferCurrency("$500,000 USD"), "USD");
  assert.equal(inferCurrency("£1,200 / month"), "GBP");
  assert.equal(inferCurrency("Fara moneda specifica"), null);
});

test("normalizeCurrency provides fallback default currency", () => {
  assert.equal(normalizeCurrency("RON"), "RON");
  assert.equal(normalizeCurrency("unknown text", "EUR"), "EUR");
  assert.equal(normalizeCurrency(null, "EUR"), "EUR");
});

test("convertCurrency calculates relative exchange conversions", () => {
  assert.equal(convertCurrency(100, "EUR", "EUR"), 100);
  assert.equal(convertCurrency(500, "RON", "EUR"), 100); // 500 * 0.20 = 100
  assert.equal(convertCurrency(100, "EUR", "RON"), 500); // 100 / 0.20 = 500
  assert.equal(convertCurrency(null, "USD", "EUR"), null);
});

test("multi-currency migration defines check constraints and conversion function", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002000_currency_multi_currency_support.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /listings_currency_check/);
  assert.match(sql, /create or replace function public\.convert_price_currency/);
  assert.match(sql, /listings_currency_idx/);
});
