import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("listing snapshots migration defines table, index, and trigger function", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002900_listing_snapshots_table.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.listing_snapshots/);
  assert.match(sql, /listing_snapshots_listing_id_created_at_idx/);
  assert.match(sql, /create or replace function public\.create_listing_snapshot/);
  assert.match(sql, /trigger_listing_snapshot/);
});
