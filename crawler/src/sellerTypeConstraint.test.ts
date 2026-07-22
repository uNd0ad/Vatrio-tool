import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { classifySellerType } from "./sellerType";

test("seller type constraint migration accepts every value the crawler emits", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260722000100_seller_type_allow_developer.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");

  assert.match(sql, /drop constraint if exists listings_seller_type_check/);
  assert.match(sql, /check \(seller_type in \('owner', 'agency', 'developer', 'unknown'\)\)/);

  // Legătura care lipsea: fiecare valoare produsă de clasificator trebuie să
  // fie permisă de constrângere, altfel un singur anunț oprește tot crawl-ul.
  const allowed = sql.match(/seller_type in \(([^)]+)\)/)![1]
    .split(",")
    .map((value) => value.trim().replace(/'/g, ""));

  const emitted = [
    classifySellerType("Proprietar particular"),
    classifySellerType("Dezvoltator imobiliar"),
    classifySellerType("Agentie imobiliara, comision 0%"),
    classifySellerType("text fără indicii"),
  ];

  for (const value of emitted) {
    assert.ok(allowed.includes(value), `constrângerea nu permite "${value}"`);
  }
  assert.ok(emitted.includes("developer"), "clasificatorul ar trebui să recunoască dezvoltatorii");
});
