import { describe, expect, it } from "vitest";
import { calculateDaysOnMarket } from "./daysOnMarket";

describe("calculateDaysOnMarket", () => {
  const now = new Date("2026-07-22T12:00:00Z");

  it("calculează zilele întregi de la scrape", () => {
    expect(calculateDaysOnMarket("2026-07-15T12:00:00Z", now)).toBe(7);
  });

  it("nu coboară sub zero pentru date viitoare", () => {
    expect(calculateDaysOnMarket("2026-08-01T00:00:00Z", now)).toBe(0);
  });

  it("returnează 0 pentru date invalide", () => {
    expect(calculateDaysOnMarket("nu-e-data", now)).toBe(0);
  });
});
