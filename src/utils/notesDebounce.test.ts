import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncedSave } from "./notesDebounce";

describe("createDebouncedSave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("amână apelul și păstrează doar ultimul set de argumente", () => {
    const fn = vi.fn();
    const debounced = createDebouncedSave(fn, 1500);
    debounced("prima");
    debounced("a doua");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith("a doua");
  });

  it("cancel oprește salvarea programată", () => {
    const fn = vi.fn();
    const debounced = createDebouncedSave(fn, 1000);
    debounced("x");
    debounced.cancel();
    vi.advanceTimersByTime(2000);
    expect(fn).not.toHaveBeenCalled();
  });
});
