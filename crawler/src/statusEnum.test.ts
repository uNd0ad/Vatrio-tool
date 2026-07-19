import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("listing status enum migration creates listing_status_enum and check constraint", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002400_listing_status_enum.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create type public\.listing_status_enum as enum/);
  assert.match(sql, /'new', 'contacted', 'refused', 'closed'/);
  assert.match(sql, /listings_status_enum_check/);
});
