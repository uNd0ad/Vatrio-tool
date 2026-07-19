import assert from "node:assert/strict";
import test from "node:test";
import { inferTransactionType, normalizeTransactionType } from "./transactionType";

test("infers transaction type from Romanian listing titles and URLs", () => {
  assert.equal(inferTransactionType("Apartament de închiriat în centru", "sale"), "rent");
  assert.equal(inferTransactionType("Vând apartament cu 3 camere", "rent"), "sale");
  assert.equal(inferTransactionType("https://www.storia.ro/ro/oferta/de-inchiriat-apartament-ID123", "sale"), "rent");
  assert.equal(inferTransactionType("https://www.imobiliare.ro/vanzare-apartamente/timisoara", "rent"), "sale");
  assert.equal(inferTransactionType("Apartament luminos central", "rent"), "rent");
});

test("normalizeTransactionType maps raw strings to canonical rent vs sale", () => {
  assert.equal(normalizeTransactionType("inchiriere"), "rent");
  assert.equal(normalizeTransactionType("chirie"), "rent");
  assert.equal(normalizeTransactionType("for-rent"), "rent");
  assert.equal(normalizeTransactionType("vanzare"), "sale");
  assert.equal(normalizeTransactionType("for-sale"), "sale");
  assert.equal(normalizeTransactionType("unknown_value", "sale"), "sale");
});
