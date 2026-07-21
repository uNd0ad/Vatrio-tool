import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_COLUMNS, getColumnConfigs, saveColumnWidth } from "./columnConfig";

describe("columnConfig", () => {
  beforeEach(() => localStorage.clear());

  it("pornește cu coloanele implicite", () => {
    expect(getColumnConfigs()).toEqual(DEFAULT_COLUMNS);
  });

  it("saveColumnWidth persistă lățimea nouă", () => {
    saveColumnWidth("price", 200);
    const price = getColumnConfigs().find((c) => c.id === "price");
    expect(price?.width).toBe(200);
  });

  it("saveColumnWidth respectă minWidth", () => {
    const updated = saveColumnWidth("price", 10);
    const price = updated.find((c) => c.id === "price");
    expect(price?.width).toBe(100); // minWidth pentru price
  });
});
