import { describe, expect, it } from "vitest";
import { calculatePricePerSqm, formatPricePerSqm } from "./pricePerSqm";

const sale = { transaction_type: "sale" } as const;
const rent = { transaction_type: "rent" } as const;

describe("calculatePricePerSqm", () => {
  it("calculează €/m² pentru vânzări, rotunjit", () => {
    expect(calculatePricePerSqm({ ...sale, price: 100000, surface_sqm: 55 })).toBe(1818);
  });

  it("nu calculează nimic pentru închirieri", () => {
    // La chirie raportul ar fi €/m² pe lună: altă unitate, care afișată lângă
    // prețurile de vânzare induce în eroare (550 € / 68 m² = "8 €/m²").
    expect(calculatePricePerSqm({ ...rent, price: 550, surface_sqm: 68 })).toBeNull();
  });

  it("returnează null pentru intrări invalide", () => {
    expect(calculatePricePerSqm({ ...sale, price: null, surface_sqm: 55 })).toBeNull();
    expect(calculatePricePerSqm({ ...sale, price: 100000, surface_sqm: null })).toBeNull();
    expect(calculatePricePerSqm({ ...sale, price: 100000, surface_sqm: 0 })).toBeNull();
    expect(calculatePricePerSqm({ ...sale, price: -5, surface_sqm: 55 })).toBeNull();
  });
});

describe("formatPricePerSqm", () => {
  it("formatează cu moneda și sufixul /m²", () => {
    expect(formatPricePerSqm({ ...sale, price: 100000, surface_sqm: 50, currency: "RON" }).endsWith(" RON/m²")).toBe(true);
    expect(formatPricePerSqm({ ...sale, price: 100000, surface_sqm: 50, currency: null }).endsWith(" EUR/m²")).toBe(true);
  });

  it("nu afișează nimic la închirieri sau la date lipsă", () => {
    expect(formatPricePerSqm({ ...rent, price: 550, surface_sqm: 68, currency: "EUR" })).toBe("");
    expect(formatPricePerSqm({ ...sale, price: null, surface_sqm: 50 })).toBe("");
  });
});
