import { beforeEach, describe, expect, it } from "vitest";
import { clearPendingOfflineQueue, enqueueOfflineChange, flushOfflineQueue, getPendingOfflineQueue } from "./offlineSync";

describe("offlineSync", () => {
  beforeEach(() => {
    localStorage.clear();
    clearPendingOfflineQueue();
  });

  it("adaugă modificări în coadă", () => {
    enqueueOfflineChange("status", "l1", "contacted");
    enqueueOfflineChange("notes", "l1", "de sunat");
    expect(getPendingOfflineQueue()).toHaveLength(2);
  });

  it("dedupe: păstrează doar ultima modificare per (listing, tip)", () => {
    enqueueOfflineChange("status", "l1", "contacted");
    enqueueOfflineChange("status", "l1", "closed");
    const queue = getPendingOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].value).toBe("closed");
  });

  it("flush golește coada la succes și raportează numărul sincronizat", async () => {
    enqueueOfflineChange("status", "l1", "contacted");
    enqueueOfflineChange("notes", "l2", "text");
    const synced = await flushOfflineQueue(async () => {});
    expect(synced).toBe(2);
    expect(getPendingOfflineQueue()).toHaveLength(0);
  });

  it("flush păstrează în coadă elementele care eșuează", async () => {
    enqueueOfflineChange("status", "ok", "contacted");
    enqueueOfflineChange("status", "fail", "closed");
    const synced = await flushOfflineQueue(async (change) => {
      if (change.listingId === "fail") throw new Error("network");
    });
    expect(synced).toBe(1);
    const remaining = getPendingOfflineQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].listingId).toBe("fail");
  });
});
