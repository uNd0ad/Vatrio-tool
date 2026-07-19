import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("listing audit migration records actor and before/after values immutably", async () => {
  const sql = await readFile(new URL("../../supabase/migrations/20260719001300_listing_audit_log.sql", import.meta.url), "utf8");
  assert.match(sql, /operation text not null check \(operation in \('INSERT', 'UPDATE', 'DELETE'\)\)/i);
  assert.match(sql, /actor_id uuid/i);
  assert.match(sql, /old_record jsonb/i);
  assert.match(sql, /new_record jsonb/i);
  assert.match(sql, /after insert or update or delete on public\.listings/i);
  assert.match(sql, /revoke insert, update, delete, truncate[\s\S]*from public, anon, authenticated/i);
});
