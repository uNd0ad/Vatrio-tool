import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { runSupabaseBackup } from "../../scripts/supabase-backup.mjs";

test("supabase backup runner handles dry run mode", async () => {
  const res = await runSupabaseBackup({ dryRun: true, backupType: "nightly" });
  assert.equal(res.status, "dry_run");
  assert.equal(res.backupType, "nightly");
});

test("backup migration file defines logs table and snapshot procedure", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719001800_supabase_backup_schedule.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create table if not exists public\.supabase_backup_logs/);
  assert.match(sql, /create or replace function public\.create_automated_backup_snapshot/);
  assert.match(sql, /p_retention_days integer default 30/);
});

test("github backup workflow is configured with nightly schedule", () => {
  const workflowPath = path.resolve(
    process.cwd(),
    "../.github/workflows/backup.yml"
  );
  const yaml = readFileSync(workflowPath, "utf-8");
  assert.match(yaml, /cron: '0 2 \* \* \*'/);
  assert.match(yaml, /node scripts\/supabase-backup\.mjs/);
});
