import { describe, expect, it } from "vitest";
import { sortListingsMultiColumn } from "./multiColumnSort";
import { makeListing } from "../testing/makeListing";

describe("sortListingsMultiColumn", () => {
  it("returnează lista neschimbată fără reguli", () => {
    const items = [makeListing({ id: "a" }), makeListing({ id: "b" })];
    expect(sortListingsMultiColumn(items, [])).toBe(items);
  });

  it("aplică a doua regulă la egalitate pe prima", () => {
    const items = [
      makeListing({ id: "a", price: 100, surface_sqm: 80 }),
      makeListing({ id: "b", price: 100, surface_sqm: 40 }),
      makeListing({ id: "c", price: 50, surface_sqm: 99 }),
    ];
    const out = sortListingsMultiColumn(items, [
      { field: "price", direction: "asc" },
      { field: "surface_sqm", direction: "asc" },
    ]);
    expect(out.map((l) => l.id)).toEqual(["c", "b", "a"]);
  });

  it("pune valorile null la coadă indiferent de direcție", () => {
    const items = [
      makeListing({ id: "a", price: null }),
      makeListing({ id: "b", price: 10 }),
    ];
    const out = sortListingsMultiColumn(items, [{ field: "price", direction: "desc" }]);
    expect(out.map((l) => l.id)).toEqual(["b", "a"]);
  });
});
