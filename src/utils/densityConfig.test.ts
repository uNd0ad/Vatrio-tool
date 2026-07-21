import { beforeEach, describe, expect, it } from "vitest";
import { getTableDensity, saveTableDensity } from "./densityConfig";

describe("densityConfig", () => {
  beforeEach(() => localStorage.clear());

  it("implicit este 'comfortable'", () => {
    expect(getTableDensity()).toBe("comfortable");
  });

  it("persistă și recitește densitatea", () => {
    saveTableDensity("compact");
    expect(getTableDensity()).toBe("compact");
  });

  it("ignoră valori necunoscute din storage", () => {
    localStorage.setItem("vatrio_table_density_v1", "gigantic");
    expect(getTableDensity()).toBe("comfortable");
  });
});
