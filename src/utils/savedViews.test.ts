import { beforeEach, describe, expect, it } from "vitest";
import { deleteSavedView, getDefaultSavedViews, getSavedViews, saveView } from "./savedViews";

describe("savedViews", () => {
  beforeEach(() => localStorage.clear());

  it("returnează vizualizările implicite când nu există nimic salvat", () => {
    expect(getSavedViews()).toEqual(getDefaultSavedViews());
  });

  it("saveView persistă și returnează vizualizarea cu id generat", () => {
    const view = saveView({ name: "Test", location: "Timișoara", maxPrice: 70000 });
    expect(view.id).toBeTruthy();
    const all = getSavedViews();
    expect(all.some((v) => v.id === view.id && v.name === "Test")).toBe(true);
  });

  it("deleteSavedView elimină vizualizarea", () => {
    const view = saveView({ name: "De șters" });
    deleteSavedView(view.id);
    expect(getSavedViews().some((v) => v.id === view.id)).toBe(false);
  });
});
