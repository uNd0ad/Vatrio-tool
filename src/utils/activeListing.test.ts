import { describe, expect, it } from "vitest";
import { isActiveListing } from "./activeListing";

describe("isActiveListing", () => {
  it("anunț fără deleted_at e activ", () => {
    expect(isActiveListing({})).toBe(true);
    expect(isActiveListing({ deleted_at: null })).toBe(true);
  });

  it("anunț cu deleted_at e inactiv", () => {
    expect(isActiveListing({ deleted_at: "2026-07-01T00:00:00Z" })).toBe(false);
  });
});
