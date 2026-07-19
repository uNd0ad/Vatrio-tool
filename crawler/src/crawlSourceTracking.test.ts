import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("crawl source tracking migration adds source_portal and crawl_run_id columns", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002800_listing_crawl_source_tracking.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /source_portal text/);
  assert.match(sql, /crawl_run_id uuid/);
  assert.match(sql, /listings_source_portal_idx/);
  assert.match(sql, /listings_crawl_run_id_idx/);
});
