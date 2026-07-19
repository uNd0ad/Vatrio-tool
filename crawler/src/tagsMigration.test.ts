import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("tag migration normalizes names and enforces attributed assignments", async () => {
  const sql = await readFile(new URL("../../supabase/migrations/20260719001600_listing_tags.sql", import.meta.url), "utf8");
  assert.match(sql, /normalized_name text generated always as \(lower\(trim\(name\)\)\) stored/i);
  assert.match(sql, /primary key \(listing_id, tag_id\)/i);
  assert.match(sql, /with check \(created_by = auth\.uid\(\)\)/i);
  assert.match(sql, /with check \(added_by = auth\.uid\(\)\)/i);
});
