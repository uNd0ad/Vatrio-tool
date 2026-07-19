import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("pgcrypto encryption support migration defines extension and encrypt/decrypt functions", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719003600_pgcrypto_encryption_support.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /create extension if not exists pgcrypto/);
  assert.match(sql, /create or replace function public\.encrypt_sensitive_text/);
  assert.match(sql, /create or replace function public\.decrypt_sensitive_text/);
});
