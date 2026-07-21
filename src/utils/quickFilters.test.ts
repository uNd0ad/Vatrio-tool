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
