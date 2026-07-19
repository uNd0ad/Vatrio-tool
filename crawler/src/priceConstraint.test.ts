import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("price non-negative check constraint migration defines check constraints", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002500_listing_price_check_constraint.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /listings_price_non_negative_check/);
  assert.match(sql, /check \(price is null or price >= 0\)/);
  assert.match(sql, /listing_price_history_new_price_non_negative_check/);
});
