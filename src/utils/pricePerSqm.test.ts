import { describe, expect, it } from "vitest";
import { calculatePricePerSqm, formatPricePerSqm } from "./pricePerSqm";

describe("pricePerSqm", () => {
  it("calculează €/m² rotunjit", () => {
    expect(calculatePricePerSqm(100000, 55)).toBe(1818);
  });

  it("returnează null pentru intrări invalide", () => {
    expect(calculatePricePerSqm(null, 55)).toBeNull();
    expect(calculatePricePerSqm(100000, null)).toBeNull();
    expect(calculatePricePerSqm(100000, 0)).toBeNull();
    expect(calculatePricePerSqm(-5, 55)).toBeNull();
  });

  it("formatează cu moneda și sufixul /m²", () => {
    const out = formatPricePerSqm(100000, 50, "RON");
    expect(out.endsWith(" RON/m²")).toBe(true);
    expect(formatPricePerSqm(100000, 50, null).endsWith(" EUR/m²")).toBe(true);
    expect(formatPricePerSqm(null, 50)).toBe("");
  });
});
