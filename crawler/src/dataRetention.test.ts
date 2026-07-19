import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("data retention policy migration defines configuration table and enforcement procedure", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719003300_configurable_data_retention_policy.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.data_retention_policies/);
  assert.match(sql, /create or replace function public\.enforce_data_retention_policies/);
  assert.match(sql, /listing_snapshots/);
  assert.match(sql, /listing_audit_logs/);
});
