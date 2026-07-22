import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MOBILE_QUERY, useIsMobile, useMediaQuery } from "./useMediaQuery";

type Listener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const list = {
    matches: initial,
    media: "",
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => list));
  return {
    resize(matches: boolean) {
      list.matches = matches;
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("useMediaQuery", () => {
  it("pornește cu valoarea curentă a interogării", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 900px)"));
    expect(result.current).toBe(true);
  });

  it("reacționează la schimbarea dimensiunii ferestrei", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 900px)"));
    expect(result.current).toBe(false);
    act(() => media.resize(true));
    expect(result.current).toBe(true);
  });

  it("dezabonează ascultătorul la demontare", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery("(max-width: 900px)"));
    expect(media.listenerCount).toBe(1);
    unmount();
    expect(media.listenerCount).toBe(0);
  });

  it("useIsMobile folosește pragul comun cu CSS-ul", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
    expect(MOBILE_QUERY).toBe("(max-width: 900px)");
  });
});
