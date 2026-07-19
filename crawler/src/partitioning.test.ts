import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("listings partitioning migration defines partition creation helper", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002300_listings_partitioning_strategy.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create or replace function public\.create_listing_partition_for_month/);
  assert.match(sql, /listings_y%s_m%s/);
  assert.match(sql, /inherits \(public\.listings\)/);
});
