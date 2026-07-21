import { beforeEach, describe, expect, it } from "vitest";
import { addSavedFilter, deleteSavedFilter, getSavedFilters } from "./savedFilters";

const sample = {
  name: "Ieftine centru",
  statusFilter: "all",
  transactionType: "sale",
  searchQuery: "centru",
  minPrice: "",
  maxPrice: "80000",
  minSqm: "",
  maxSqm: "",
  dateRange: "all",
};

describe("savedFilters", () => {
  beforeEach(() => localStorage.clear());

  it("pornește gol", () => {
    expect(getSavedFilters()).toEqual([]);
  });

  it("addSavedFilter pune filtrul nou primul și persistă", () => {
    addSavedFilter(sample);
    const updated = addSavedFilter({ ...sample, name: "Al doilea" });
    expect(updated[0].name).toBe("Al doilea");
    expect(getSavedFilters()).toHaveLength(2);
    expect(getSavedFilters()[0].id).toBeTruthy();
  });

  it("deleteSavedFilter elimină după id", () => {
    const [saved] = addSavedFilter(sample);
    const remaining = deleteSavedFilter(saved.id);
    expect(remaining).toEqual([]);
    expect(getSavedFilters()).toEqual([]);
  });
});
