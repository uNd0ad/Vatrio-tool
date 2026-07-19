import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("foreign key cascade review migration defines ON DELETE CASCADE and ON DELETE SET NULL", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719002100_foreign_key_cascade_review.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /listing_price_history_listing_id_fkey/);
  assert.match(sql, /on delete cascade/i);
  assert.match(sql, /listing_activity_logs_user_id_fkey/);
  assert.match(sql, /on delete set null/i);
});
