import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NEIGHBORHOOD_ALIASES, NEIGHBORHOOD_NAMES, TIMISOARA_NEIGHBORHOODS } from "./neighborhoods";
import { foldText } from "./text";

const LIST_PATH = new URL("../../../ListaCartiereTM.txt", import.meta.url);

async function listedNeighborhoods(): Promise<string[]> {
  const raw = await readFile(LIST_PATH, "utf8");
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

test("catalogul acoperă exact cartierele din ListaCartiereTM.txt", async () => {
  const listed = await listedNeighborhoods();
  // Lista e scrisă fără diacritice, catalogul cu — comparăm formele pliate, ca
  // fișierul să rămână sursa de adevăr pentru *care* cartiere există.
  assert.deepEqual(
    NEIGHBORHOOD_NAMES.map(foldText).sort(),
    listed.map(foldText).sort()
  );
  assert.equal(NEIGHBORHOOD_NAMES.length, listed.length);
});

test("numele canonice sunt unice și nevide", () => {
  assert.equal(new Set(NEIGHBORHOOD_NAMES).size, NEIGHBORHOOD_NAMES.length);
  for (const name of NEIGHBORHOOD_NAMES) assert.ok(name.trim().length > 0, `nume gol: "${name}"`);
});

test("un alias nu poate trimite la două cartiere diferite", () => {
  const owners = new Map<string, string>();
  for (const { entry, folded } of NEIGHBORHOOD_ALIASES) {
    const previous = owners.get(folded);
    assert.equal(
      previous ?? entry.name,
      entry.name,
      `aliasul "${folded}" e revendicat de ${previous} și de ${entry.name}`
    );
    owners.set(folded, entry.name);
  }
});

test("aliasurile lungi sunt încercate înaintea celor scurte", () => {
  const lengths = NEIGHBORHOOD_ALIASES.map((alias) => alias.folded.length);
  assert.deepEqual(lengths, [...lengths].sort((a, b) => b - a));
});

test("fiecare cartier își are numele canonic printre aliasuri", () => {
  for (const entry of TIMISOARA_NEIGHBORHOODS) {
    const folded = foldText(entry.name);
    assert.ok(
      NEIGHBORHOOD_ALIASES.some((alias) => alias.folded === folded && alias.entry.name === entry.name),
      `lipsește aliasul canonic pentru ${entry.name}`
    );
  }
});
