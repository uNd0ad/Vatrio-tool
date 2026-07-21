import { beforeEach, describe, expect, it } from "vitest";
import { clearUndoStack, getUndoStackSize, peekUndoAction, popUndoAction, pushUndoAction } from "./undoStack";

describe("undoStack", () => {
  beforeEach(() => clearUndoStack());

  it("push/pop funcționează LIFO", () => {
    pushUndoAction({ type: "status", listingId: "a", previousStatus: "new" });
    pushUndoAction({ type: "status", listingId: "b", previousStatus: "contacted" });
    expect(peekUndoAction()?.listingId).toBe("b");
    expect(popUndoAction()?.listingId).toBe("b");
    expect(popUndoAction()?.listingId).toBe("a");
    expect(popUndoAction()).toBeUndefined();
  });

  it("limitează stiva la 20 de acțiuni", () => {
    for (let i = 0; i < 25; i++) {
      pushUndoAction({ type: "status", listingId: `l-${i}`, previousStatus: "new" });
    }
    expect(getUndoStackSize()).toBe(20);
    expect(peekUndoAction()?.listingId).toBe("l-24");
  });
});
