import { describe, expect, it } from "vitest";
import { convertListingsToCsv } from "./exportListings";
import { makeListing } from "../testing/makeListing";

describe("convertListingsToCsv", () => {
  it("produce antet + câte un rând per anunț", () => {
    const csv = convertListingsToCsv([
      makeListing({ id: "a", title: "Apartament centru" }),
      makeListing({ id: "b", title: "Garsonieră" }),
    ]);
    const lines = csv.trim().split("\n");
    expect(lines.length).toBe(3);
    expect(csv).toContain("Apartament centru");
  });

  it("escapează valorile cu virgule sau ghilimele", () => {
    const csv = convertListingsToCsv([
      makeListing({ title: 'Apartament "lux", etaj 2' }),
    ]);
    expect(csv).toContain('"Apartament ""lux"", etaj 2"');
  });
});
