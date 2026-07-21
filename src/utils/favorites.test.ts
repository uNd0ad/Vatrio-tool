import { beforeEach, describe, expect, it } from "vitest";
import { getStarredListingIds, isListingStarred, toggleStarredListing } from "./favorites";

describe("favorites", () => {
  beforeEach(() => localStorage.clear());

  it("pornește gol", () => {
    expect(getStarredListingIds().size).toBe(0);
  });

  it("toggle adaugă și apoi elimină un id, persistând în localStorage", () => {
    expect(toggleStarredListing("x1")).toBe(true);
    expect(isListingStarred("x1")).toBe(true);
    expect(getStarredListingIds().has("x1")).toBe(true);

    expect(toggleStarredListing("x1")).toBe(false);
    expect(isListingStarred("x1")).toBe(false);
  });

  it("tolerează date corupte în storage", () => {
    localStorage.setItem("vatrio_starred_listings_v1", "{nu-e-json");
    expect(getStarredListingIds().size).toBe(0);
  });
});
