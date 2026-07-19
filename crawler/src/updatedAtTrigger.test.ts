import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("auto-update updated_at trigger migration defines function and trigger", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002600_auto_update_updated_at_trigger.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create or replace function public\.set_updated_at_timestamp/);
  assert.match(sql, /before update on public\.listings/);
  assert.match(sql, /trigger_set_listings_updated_at/);
});
