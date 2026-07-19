import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("listing_photos table migration defines table, indexes, and RLS policies", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002700_listing_photos_table.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.listing_photos/);
  assert.match(sql, /references public\.listings\(id\) on delete cascade/);
  assert.match(sql, /listing_photos_listing_id_idx/);
  assert.match(sql, /enable row level security/);
});
