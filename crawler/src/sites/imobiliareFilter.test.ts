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

test("recognises the offer-slug shapes used by imobiliare.ro today", () => {
  // Filtrul de linkuri din crawlImobiliare trebuie să accepte ambele sluguri;
  // varianta veche căuta "-inchiriere-", care nu apare în niciun URL real.
  const isOffer = (href: string) =>
    !/\/(vanzare|inchirieri)-[a-z]+(\/|$|\?)/i.test(href) &&
    (href.includes("/oferta/") || href.includes("/anunt/") || /-de-(vanzare|inchiriat)-/i.test(href) || /X[A-Z0-9]{8}/i.test(href));

  assert.equal(isOffer("/oferta/apartament-de-inchiriat-timisoara-dacia-2-camere-275736885"), true);
  assert.equal(isOffer("/oferta/apartament-de-vanzare-timisoara-aradului-2-camere-259964119"), true);
  assert.equal(isOffer("/inchirieri-apartamente/timisoara"), false);
  assert.equal(isOffer("/vanzare-apartamente/timisoara"), false);
});
