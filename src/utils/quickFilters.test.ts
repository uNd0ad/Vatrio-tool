import { describe, expect, it } from "vitest";
import { applyQuickFilter } from "./quickFilters";
import { makeListing } from "../testing/makeListing";

describe("applyQuickFilter", () => {
  it("'all' returnează tot", () => {
    const items = [makeListing()];
    expect(applyQuickFilter(items, "all")).toBe(items);
  });

  it("'new_today' păstrează doar anunțurile scrape-uite azi", () => {
    const today = makeListing({ id: "t", date_scraped: new Date().toISOString() });
    const old = makeListing({ id: "o", date_scraped: "2020-01-01T00:00:00Z" });
    expect(applyQuickFilter([today, old], "new_today").map((l) => l.id)).toEqual(["t"]);
  });

  it("'price_dropped' cere istoric cu cel puțin două prețuri", () => {
    const dropped = makeListing({
      id: "d",
      price_history: [
        { price: 110000, date: "2026-06-01" },
        { price: 100000, date: "2026-07-01" },
      ],
    });
    const flat = makeListing({ id: "f", price_history: [{ price: 100000, date: "2026-07-01" }] });
    expect(applyQuickFilter([dropped, flat], "price_dropped").map((l) => l.id)).toEqual(["d"]);
  });

  it("'below_average' păstrează anunțurile sub media €/m²", () => {
    const cheap = makeListing({ id: "cheap", price: 50000, surface_sqm: 50 });   // 1000 €/m²
    const expensive = makeListing({ id: "exp", price: 200000, surface_sqm: 50 }); // 4000 €/m²
    const out = applyQuickFilter([cheap, expensive], "below_average");
    expect(out.map((l) => l.id)).toEqual(["cheap"]);
  });
});

describe("applyQuickFilter 'below_average' pe tipuri de tranzacție", () => {
  it("compară fiecare anunț cu media propriului tip, nu cu una amestecată", () => {
    // Cu o medie comună, orice chirie (€/m² mic) ieșea automat „sub medie",
    // iar vânzările aproape niciodată — filtrul devenea inutil.
    const items = [
      makeListing({ id: "vanzare-ieftina", transaction_type: "sale", price: 50000, surface_sqm: 50 }),   // 1000 €/m²
      makeListing({ id: "vanzare-scumpa", transaction_type: "sale", price: 200000, surface_sqm: 50 }),   // 4000 €/m²
      makeListing({ id: "chirie-ieftina", transaction_type: "rent", price: 300, surface_sqm: 50 }),      // 6 €/m²
      makeListing({ id: "chirie-scumpa", transaction_type: "rent", price: 900, surface_sqm: 50 }),       // 18 €/m²
    ];
    const out = applyQuickFilter(items, "below_average").map((l) => l.id);
    expect(out).toContain("vanzare-ieftina");
    expect(out).toContain("chirie-ieftina");
    expect(out).not.toContain("vanzare-scumpa");
    expect(out).not.toContain("chirie-scumpa");
  });

  it("nu elimină tot când există un singur tip de tranzacție", () => {
    const items = [
      makeListing({ id: "a", transaction_type: "rent", price: 300, surface_sqm: 50 }),
      makeListing({ id: "b", transaction_type: "rent", price: 900, surface_sqm: 50 }),
    ];
    expect(applyQuickFilter(items, "below_average").map((l) => l.id)).toEqual(["a"]);
  });
});
