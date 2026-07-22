import assert from "node:assert/strict";
import test from "node:test";
import { normalizeLocation } from "./location";

test("normalizes portal location labels and common zone names", () => {
  assert.equal(normalizeLocation(" Timisoara | Calea Sagului - Azi la 10:20 ", "Timișoara"), "Timișoara, Calea Șagului");
  assert.equal(normalizeLocation("jud. Timis, Circumvalatiunii", "Timișoara"), "Timiș, Circumvalațiunii");
  assert.equal(normalizeLocation("", "Timișoara"), "Timișoara");
});

test("normalizeLocation strips portal freshness suffixes", () => {
  assert.equal(normalizeLocation("Timisoara - Reactualizat la 16 iulie 2026", "x"), "Timișoara");
  assert.equal(normalizeLocation("Timisoara - 14 iulie 2026", "x"), "Timișoara");
  assert.equal(normalizeLocation("Timisoara - azi", "x"), "Timișoara");
});
