import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("archived_listings table migration defines table and move_deleted_listings_to_archive procedure", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719003200_archived_listings_table.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.archived_listings/);
  assert.match(sql, /create or replace function public\.move_deleted_listings_to_archive/);
  assert.match(sql, /insert into public\.archived_listings/);
});
