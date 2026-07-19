import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("client_matches table migration defines table, indexes, and RLS policies", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719003400_client_matches_table.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.client_matches/);
  assert.match(sql, /references public\.listings\(id\) on delete cascade/);
  assert.match(sql, /client_matches_client_id_idx/);
  assert.match(sql, /enable row level security/);
});
