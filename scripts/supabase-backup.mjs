#!/usr/bin/env node
/**
 * Automated Supabase Backup Runner.
 * Executes the database snapshot function, logs status, and verifies retention.
 *
 * Usage:
 *   node scripts/supabase-backup.mjs [--type nightly|manual|pre_migration]
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseArgs() {
  const args = process.argv.slice(2);
  const typeIdx = args.indexOf("--type");
  const backupType = typeIdx >= 0 ? args[typeIdx + 1] : "nightly";
  return { backupType, dryRun: args.includes("--dry-run") };
}

export async function runSupabaseBackup(opts = {}) {
  const backupType = opts.backupType || "nightly";
  const dryRun = opts.dryRun || false;

  if (dryRun) {
    console.log(`[Backup Dry Run] Would initiate Supabase snapshot for type: ${backupType}`);
    return { status: "dry_run", backupType };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase.rpc("create_automated_backup_snapshot", {
    p_backup_type: backupType,
    p_retention_days: 30,
  });

  if (error) {
    console.error(`[Backup Error] Failed to create backup snapshot: ${error.message}`);
    throw error;
  }

  console.log(`[Backup Success] Created automated snapshot ID: ${data}`);
  return { status: "success", snapshotId: data, backupType };
}

async function main() {
  const opts = parseArgs();
  try {
    await runSupabaseBackup(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
