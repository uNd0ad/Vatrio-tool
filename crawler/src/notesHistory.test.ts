import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("notes_history table migration defines table, index, and trigger function", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719003500_notes_history_table.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.notes_history/);
  assert.match(sql, /create or replace function public\.create_note_history_entry/);
  assert.match(sql, /trigger_note_history/);
});
