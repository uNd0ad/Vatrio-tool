import { describe, expect, it } from "vitest";
import { sortListings } from "./sorting";
import { makeListing } from "../testing/makeListing";

describe("sortListings", () => {
  const cheap = makeListing({ id: "a", price: 50000 });
  const pricey = makeListing({ id: "b", price: 150000 });
  const noPrice = makeListing({ id: "c", price: null });

  it("sortează crescător după preț, cu null la coadă", () => {
    const out = sortListings([pricey, noPrice, cheap], { field: "price", order: "asc" });
    expect(out.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("sortează descrescător după preț", () => {
    const out = sortListings([cheap, pricey], { field: "price", order: "desc" });
    expect(out.map((l) => l.id)).toEqual(["b", "a"]);
  });

  it("sortează după dată", () => {
    const older = makeListing({ id: "old", date_scraped: "2026-01-01T00:00:00Z" });
    const newer = makeListing({ id: "new", date_scraped: "2026-07-01T00:00:00Z" });
    const out = sortListings([older, newer], { field: "date_scraped", order: "desc" });
    expect(out[0].id).toBe("new");
  });

  it("nu mută elementele din array-ul original", () => {
    const input = [pricey, cheap];
    sortListings(input, { field: "price", order: "asc" });
    expect(input[0].id).toBe("b");
  });
});
