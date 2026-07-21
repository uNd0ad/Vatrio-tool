import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SEARCHES, parseSearchConfig } from "./searchConfig";

test("default searches cover every site with sale and rent targets", () => {
  for (const site of ["olx", "imobiliare", "storia", "homezz", "publi24"] as const) {
    const targets = DEFAULT_SEARCHES[site];
    assert.ok(targets.length >= 2, `${site} are cel puțin 2 căutări`);
    assert.ok(targets.some((t) => t.transactionType === "sale"));
    assert.ok(targets.some((t) => t.transactionType === "rent"));
  }
});

test("parseSearchConfig overrides only the sites present in the JSON", () => {
  const config = parseSearchConfig(JSON.stringify({
    olx: [{ url: "https://www.olx.ro/imobiliare/cluj/", transactionType: "sale", label: "Cluj" }],
  }));
  assert.equal(config.olx.length, 1);
  assert.equal(config.olx[0].label, "Cluj");
  assert.deepEqual(config.storia, DEFAULT_SEARCHES.storia);
});

test("parseSearchConfig rejects unknown sites", () => {
  assert.throws(
    () => parseSearchConfig(JSON.stringify({ oxl: [] })),
    /site necunoscut "oxl"/
  );
});

test("parseSearchConfig rejects malformed targets", () => {
  assert.throws(
    () => parseSearchConfig(JSON.stringify({ olx: [{ url: "nu-e-url", transactionType: "sale", label: "x" }] })),
    /listă de obiecte/
  );
  assert.throws(
    () => parseSearchConfig(JSON.stringify({ olx: [{ url: "https://ok.ro", transactionType: "leasing", label: "x" }] })),
    /listă de obiecte/
  );
});

test("parseSearchConfig rejects invalid JSON with a clear message", () => {
  assert.throws(() => parseSearchConfig("{nu e json"), /nu este JSON valid/);
});
