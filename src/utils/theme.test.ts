import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getPreferredTheme } from "./theme";

function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    matches: prefersDark && query.includes("dark"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
}

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    stubMatchMedia(false);
  });

  it("folosește preferința salvată din localStorage", () => {
    localStorage.setItem("vatrio_theme", "dark");
    expect(getPreferredTheme()).toBe("dark");
  });

  it("ignoră valorile corupte și cade pe preferința sistemului", () => {
    localStorage.setItem("vatrio_theme", "banana");
    stubMatchMedia(true);
    expect(getPreferredTheme()).toBe("dark");
    stubMatchMedia(false);
    expect(getPreferredTheme()).toBe("light");
  });

  it("applyTheme comută clasa .dark pe root și persistă alegerea", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("vatrio_theme")).toBe("dark");

    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("vatrio_theme")).toBe("light");
  });
});
