import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { NEIGHBORHOODS, neighborhoodLabel } from "./neighborhoods";

/** Aceeași pliere ca în parserul crawlerului: fără diacritice, minuscule. */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

describe("lista de cartiere din UI", () => {
  it("acoperă exact cartierele din ListaCartiereTM.txt", () => {
    const listPath = path.resolve(process.cwd(), "ListaCartiereTM.txt");
    const listed = readFileSync(listPath, "utf-8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(NEIGHBORHOODS.map(fold).sort()).toEqual(listed.map(fold).sort());
  });

  it("nu are duplicate", () => {
    expect(new Set(NEIGHBORHOODS).size).toBe(NEIGHBORHOODS.length);
  });

  it("e sortată alfabetic, cum o vede utilizatorul în filtru", () => {
    const sorted = [...NEIGHBORHOODS].sort((a, b) => a.localeCompare(b, "ro-RO"));
    expect(NEIGHBORHOODS).toEqual(sorted);
  });

  it("numește explicit anunțurile fără cartier", () => {
    expect(neighborhoodLabel("Fabric")).toBe("Fabric");
    expect(neighborhoodLabel(null)).toBe("Neîncadrat");
    expect(neighborhoodLabel(undefined)).toBe("Neîncadrat");
  });
});
