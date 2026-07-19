import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("dashboard views migration defines v_dashboard_summary and mv_city_analytics", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002200_dashboard_views.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create or replace view public\.v_dashboard_summary/);
  assert.match(sql, /create materialized view if not exists public\.mv_city_analytics/);
  assert.match(sql, /create or replace function public\.refresh_city_analytics/);
  assert.match(sql, /refresh materialized view concurrently public\.mv_city_analytics/);
});
