import assert from "node:assert/strict";
import test from "node:test";
import { inferPropertyType, normalizePropertyType } from "./propertyType";

test("normalizePropertyType maps Romanian property terms to canonical categories", () => {
  assert.equal(normalizePropertyType("Apartamente 2 camere"), "apartment");
  assert.equal(normalizePropertyType("Garsoniera cocheta"), "apartment");
  assert.equal(normalizePropertyType("Casa p+1 spațioasă"), "house");
  assert.equal(normalizePropertyType("Vila duplex"), "house");
  assert.equal(normalizePropertyType("Teren intravilan 500mp"), "land");
  assert.equal(normalizePropertyType("Spatiu comercial ultracentral"), "commercial");
  assert.equal(normalizePropertyType("Birouri clasa A"), "office");
  assert.equal(normalizePropertyType("Garaj subteran"), "garage");
  assert.equal(normalizePropertyType(null), "other");
});

test("inferPropertyType extracts category from URLs and titles", () => {
  assert.equal(
    inferPropertyType("https://www.storia.ro/ro/oferta/apartament-2-camere-timisoara-ID123.html"),
    "apartment"
  );
  assert.equal(
    inferPropertyType("https://www.olx.ro/d/oferta/casa-de-vanzare-giroc-IDabc.html"),
    "house"
  );
  assert.equal(
    inferPropertyType("https://www.imobiliare.ro/vanzare-terenuri-constructii/timisoara/girocului"),
    "land"
  );
  assert.equal(
    inferPropertyType(null, "garsoniera"),
    "apartment"
  );
});
