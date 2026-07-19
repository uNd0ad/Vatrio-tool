import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("explicit RLS migration protects user-owned writes and privileged RPCs", async () => {
  const sql = await readFile(new URL("../../supabase/migrations/20260719001100_explicit_row_level_security.sql", import.meta.url), "utf8");
  for (const table of ["listings", "listing_price_history", "listing_activity_logs", "crawler_runs", "crawler_site_runs", "crawl_jobs"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /with check \(user_id = auth\.uid\(\)\)/i);
  assert.match(sql, /revoke all on function public\.soft_delete_listing\(uuid\) from public, anon/i);
  assert.match(sql, /revoke all on function public\.restore_listing\(uuid\) from public, anon/i);
});
