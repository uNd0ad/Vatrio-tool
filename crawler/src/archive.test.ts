import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { archiveCutoff } from "./archive";

test("archiveCutoff calculates an ISO cutoff date X months in the past", () => {
  const fixedNow = new Date("2026-07-15T12:00:00.000Z").getTime();
  const cutoff = archiveCutoff(3, fixedNow);
  assert.equal(cutoff, "2026-04-15T12:00:00.000Z");
});

test("archiveCutoff throws RangeError for invalid month counts", () => {
  assert.throws(() => archiveCutoff(0), RangeError);
  assert.throws(() => archiveCutoff(-2), RangeError);
});

test("auto-archive migration defines archive_inactive_listings procedure", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719001900_auto_archive_inactive_listings.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create or replace function public\.archive_inactive_listings/);
  assert.match(sql, /inactive_months integer default 3/);
  assert.match(sql, /status = 'closed'/);
  assert.match(sql, /deleted_at = coalesce\(deleted_at, now\(\)\)/);
});
