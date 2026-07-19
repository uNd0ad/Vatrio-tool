import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("column comments migration adds self-documentation comments across key tables", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719003100_column_comments_self_documentation.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /comment on table public\.listings is/);
  assert.match(sql, /comment on column public\.listings\.price is/);
  assert.match(sql, /comment on column public\.listings\.latitude is/);
});
