import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("unique source external_id constraint migration defines unique index", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719003000_unique_source_external_id_constraint.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create unique index if not exists listings_source_portal_external_id_active_idx/);
  assert.match(sql, /on public\.listings \(source_portal, external_id\)/);
  assert.match(sql, /where deleted_at is null/);
});
