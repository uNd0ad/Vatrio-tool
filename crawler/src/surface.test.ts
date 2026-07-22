import assert from "node:assert/strict";
import test from "node:test";
import { parseSurface } from "./surface";

test("parses the unit spellings the portals actually emit", () => {
  assert.equal(parseSurface("Apartament 2 camere, 54 mp"), 54);
  assert.equal(parseSurface("2 camere | 52 m² | etajul 2/3"), 52);
  // Publi24 scrie m<sup>2</sup>, deci textContent dă "m2".
  assert.equal(parseSurface("Apartament 3 camere, 78 m2, Dacia"), 78);
  assert.equal(parseSurface("78.15 mp utili"), 78.15);
  assert.equal(parseSurface("49,5 mp"), 49.5);
});

test("returns null when the card mentions no surface", () => {
  assert.equal(parseSurface("Apartament 2 camere, parter, Bd Cetatii"), null);
  assert.equal(parseSurface(""), null);
  assert.equal(parseSurface(null), null);
});

test("rejects values that cannot be an apartment surface", () => {
  // Fără plafoane, „300000 mp" sau „2 mp" ar intra ca suprafețe reale.
  assert.equal(parseSurface("Teren 5000 mp"), null);
  assert.equal(parseSurface("boxa 2 mp"), null);
});

test("does not confuse the room count with the surface", () => {
  assert.equal(parseSurface("Apartament cu 3 camere, 68 mp"), 68);
});
