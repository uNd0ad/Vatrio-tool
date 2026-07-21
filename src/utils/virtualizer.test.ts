import { describe, expect, it } from "vitest";
import { getVirtualSlice } from "./virtualizer";

describe("getVirtualSlice", () => {
  it("returnează felie goală pentru liste goale", () => {
    expect(getVirtualSlice({ totalItems: 0, itemHeight: 56, scrollTop: 0, containerHeight: 600 }))
      .toEqual({ startIndex: 0, endIndex: 0, topPadding: 0, bottomPadding: 0 });
  });

  it("felia de la începutul listei include overscan doar în jos", () => {
    const s = getVirtualSlice({ totalItems: 1000, itemHeight: 50, scrollTop: 0, containerHeight: 500, overscan: 5 });
    expect(s.startIndex).toBe(0);
    expect(s.endIndex).toBe(15); // 10 vizibile + 5 overscan
    expect(s.topPadding).toBe(0);
    expect(s.bottomPadding).toBe((1000 - 15) * 50);
  });

  it("felia din mijloc are padding sus și jos consistente", () => {
    const s = getVirtualSlice({ totalItems: 1000, itemHeight: 50, scrollTop: 5000, containerHeight: 500, overscan: 5 });
    expect(s.startIndex).toBe(95);   // 100 - overscan
    expect(s.endIndex).toBe(115);    // 100 + 10 + overscan
    expect(s.topPadding).toBe(95 * 50);
    expect(s.bottomPadding).toBe((1000 - 115) * 50);
  });

  it("nu depășește capătul listei", () => {
    const s = getVirtualSlice({ totalItems: 20, itemHeight: 50, scrollTop: 100000, containerHeight: 500 });
    expect(s.endIndex).toBe(20);
    expect(s.bottomPadding).toBe(0);
  });
});
