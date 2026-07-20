import assert from "node:assert/strict";
import test from "node:test";
import { isImobiliareListingCandidate } from "./imobiliareFilter";

test("rejects Imobiliare AdaugaAnunt navigation cards", () => {
  assert.equal(isImobiliareListingCandidate({
    title: "AdaugaAnunt",
    href: "/adauga-anunt",
    cardText: "Adaugă anunț",
  }), false);
  assert.equal(isImobiliareListingCandidate({
    title: "Adaugă anunț gratuit",
    href: "/cont/anunt-nou",
    cardText: "Publică proprietatea",
  }), false);
});

test("keeps genuine Imobiliare property cards", () => {
  assert.equal(isImobiliareListingCandidate({
    title: "Apartament cu 2 camere de vânzare",
    href: "/oferta/apartament-de-vanzare-X12345678",
    cardText: "89.000 EUR · 54 mp · Timișoara",
  }), true);
});
