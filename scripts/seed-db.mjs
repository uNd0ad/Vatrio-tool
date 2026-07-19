import { readFileSync } from 'node:fs';
import path from 'node:path';

export function getSeedData() {
  const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..');
  const seedPath = path.resolve(rootDir, 'supabase/seed.sql');
  const sql = readFileSync(seedPath, 'utf-8');
  return { sql, seedPath };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const { sql } = getSeedData();
  console.log('[Seed DB] Executing local database seed script...');
  console.log(`Loaded ${sql.length} bytes of SQL statements.`);
}
