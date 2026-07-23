import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("clavium_sync migration models bidirectional state, guarded by RLS", () => {
  const sql = readFileSync(
    path.resolve(process.cwd(), "../supabase/migrations/20260723000300_clavium_sync.sql"),
    "utf-8"
  );
  assert.match(sql, /create table if not exists public\.clavium_sync/);
  // Cheia e listing_id (un rând per anunț), cu FK cascade.
  assert.match(sql, /listing_id uuid primary key references public\.listings\(id\) on delete cascade/);
  // Sensul de intrare: datele întoarse de Clavium.
  assert.match(sql, /clavium_data jsonb/);
  // Statusurile acoperă ambele sensuri (trimis / potrivit / eșuat).
  assert.match(sql, /check \(status in \('pending', 'synced', 'failed', 'matched', 'removed'\)\)/);
  // Scrierile doar din Edge Function (service_role); citire pentru autentificați.
  assert.match(sql, /clavium_sync_authenticated_read/);
  assert.match(sql, /clavium_sync_service_write/);
});
