import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("purge migration deletes only listings soft-deleted past the retention window", () => {
  const sql = readFileSync(
    path.resolve(process.cwd(), "../supabase/migrations/20260723000100_purge_deleted_listings_after_30_days.sql"),
    "utf-8"
  );
  // Fereastra vine din data_retention_policies, implicit 30 de zile.
  assert.match(sql, /'listings_soft_deleted', 30/);
  assert.match(sql, /create or replace function public\.purge_expired_deleted_listings/);
  // Se șterg strict rândurile soft-deleted expirate, nu cele active.
  assert.match(sql, /where deleted_at is not null/);
  assert.match(sql, /deleted_at < now\(\) - \(days \|\| ' days'\)::interval/);
  // Programare zilnică prin pg_cron, cu nume stabil (idempotent).
  assert.match(sql, /cron\.schedule\(\s*'purge-expired-deleted-listings'/);
});
