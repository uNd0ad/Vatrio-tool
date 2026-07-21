import { describe, expect, it } from "vitest";
import { getNextFocusedRowIndex } from "./tableKeyboardNav";

describe("getNextFocusedRowIndex", () => {
  it("returnează -1 pentru tabel gol", () => {
    expect(getNextFocusedRowIndex(3, 0, "ArrowDown")).toBe(-1);
  });

  it("intră pe primul rând când nu există focus", () => {
    expect(getNextFocusedRowIndex(-1, 10, "ArrowDown")).toBe(0);
    expect(getNextFocusedRowIndex(-1, 10, "ArrowUp")).toBe(0);
  });

  it("navighează în jos și se oprește la ultimul rând", () => {
    expect(getNextFocusedRowIndex(0, 3, "ArrowDown")).toBe(1);
    expect(getNextFocusedRowIndex(2, 3, "ArrowDown")).toBe(2);
  });

  it("navighează în sus și se oprește la primul rând", () => {
    expect(getNextFocusedRowIndex(2, 3, "ArrowUp")).toBe(1);
    expect(getNextFocusedRowIndex(0, 3, "ArrowUp")).toBe(0);
  });
});
