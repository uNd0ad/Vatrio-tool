import { describe, expect, it } from "vitest";
import { formatPrice, formatDate, truncateListingTitle } from "./format";

describe("formatPrice", () => {
  it("returnează mesaj pentru preț lipsă", () => {
    expect(formatPrice({ price: null, currency: "EUR" })).toBe("Preț indisponibil");
  });

  it("formatează prețul cu moneda dată", () => {
    const out = formatPrice({ price: 125000, currency: "RON" });
    expect(out.endsWith(" RON")).toBe(true);
    expect(out).toContain("125");
  });

  it("cade pe EUR când moneda lipsește", () => {
    expect(formatPrice({ price: 500, currency: null }).endsWith(" EUR")).toBe(true);
  });
});

describe("formatDate", () => {
  it("produce o dată lizibilă în ro-RO", () => {
    const out = formatDate("2026-07-18T17:56:44.500Z");
    expect(out).toMatch(/18/);
    expect(out.length).toBeGreaterThan(5);
  });
});

describe("truncateListingTitle", () => {
  it("lasă titlurile scurte neatinse", () => {
    expect(truncateListingTitle("Garsonieră centrală")).toBe("Garsonieră centrală");
  });

  it("taie titlurile lungi la limită și adaugă elipsă", () => {
    const long = "x".repeat(100);
    const out = truncateListingTitle(long, 70);
    expect(out.length).toBeLessThanOrEqual(70);
    expect(out.endsWith("…")).toBe(true);
  });
});
