import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("activity logs baseline migration creates the table 20260719001100 depends on", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719001050_listing_activity_logs_baseline.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.listing_activity_logs/);
  assert.match(sql, /listing_id uuid not null references public\.listings\(id\) on delete cascade/);
  assert.match(sql, /alter table public\.listing_activity_logs enable row level security/);
});
