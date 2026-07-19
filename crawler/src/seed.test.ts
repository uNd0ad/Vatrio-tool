import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSeedData } from "../../scripts/seed-db.mjs";

test("seed script defines realistic local sample listings for dev environment", () => {
  const { sql } = getSeedData();
  assert.match(sql, /insert into public\.listings/i);
  assert.match(sql, /Complex Studentesc/);
  assert.match(sql, /storia/);
  assert.match(sql, /imobiliare/);
  assert.match(sql, /olx/);
});
