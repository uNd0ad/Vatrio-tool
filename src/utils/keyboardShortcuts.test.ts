import { describe, expect, it, vi } from "vitest";
import { handleKeyboardShortcut, type ShortcutHandlers } from "./keyboardShortcuts";

function press(init: KeyboardEventInit, target?: EventTarget): { event: KeyboardEvent; handlers: Required<ShortcutHandlers>; handled: boolean } {
  const handlers = {
    onSearch: vi.fn(),
    onRefresh: vi.fn(),
    onSetStatus: vi.fn(),
    onEscape: vi.fn(),
    onUndo: vi.fn(),
  };
  const event = new KeyboardEvent("keydown", { cancelable: true, ...init });
  if (target) Object.defineProperty(event, "target", { value: target });
  const handled = handleKeyboardShortcut(event, handlers);
  return { event, handlers, handled };
}

describe("handleKeyboardShortcut", () => {
  it("⌘K deschide căutarea", () => {
    const { handlers, handled } = press({ key: "k", metaKey: true });
    expect(handled).toBe(true);
    expect(handlers.onSearch).toHaveBeenCalledOnce();
  });

  it("Ctrl+R declanșează refresh", () => {
    const { handlers } = press({ key: "r", ctrlKey: true });
    expect(handlers.onRefresh).toHaveBeenCalledOnce();
  });

  it("⌘Z declanșează undo", () => {
    const { handlers } = press({ key: "z", metaKey: true });
    expect(handlers.onUndo).toHaveBeenCalledOnce();
  });

  it("Escape închide drawerul", () => {
    const { handlers } = press({ key: "Escape" });
    expect(handlers.onEscape).toHaveBeenCalledOnce();
  });

  it("tastele 1-4 setează statusul", () => {
    const { handlers } = press({ key: "2" });
    expect(handlers.onSetStatus).toHaveBeenCalledWith("contacted");
  });

  it("cifrele NU schimbă statusul când focusul e într-un input", () => {
    const input = document.createElement("input");
    const { handlers, handled } = press({ key: "1" }, input);
    expect(handled).toBe(false);
    expect(handlers.onSetStatus).not.toHaveBeenCalled();
  });
});
