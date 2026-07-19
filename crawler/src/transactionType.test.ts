import assert from "node:assert/strict";
import test from "node:test";
import { inferTransactionType } from "./transactionType";

test("infers transaction type from Romanian listing titles", () => {
  assert.equal(inferTransactionType("Apartament de închiriat în centru", "sale"), "rent");
  assert.equal(inferTransactionType("Vând apartament cu 3 camere", "rent"), "sale");
  assert.equal(inferTransactionType("Apartament luminos central", "rent"), "rent");
});
