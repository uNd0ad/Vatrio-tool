import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("listing filter indexes cover active status, location, and price queries", async () => {
  const sql = await readFile(new URL("../../supabase/migrations/20260719001200_listing_filter_indexes.sql", import.meta.url), "utf8");
  assert.match(sql, /on public\.listings \(status\)[\s\S]*where deleted_at is null/i);
  assert.match(sql, /on public\.listings \(lower\(location\)\)[\s\S]*location is not null/i);
  assert.match(sql, /on public\.listings \(price\)[\s\S]*price is not null/i);
  assert.match(sql, /include \(location\)/i);
});
