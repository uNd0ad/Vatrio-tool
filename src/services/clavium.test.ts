import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
vi.mock("../lib/supabaseClient", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

const { pushListingsToClavium, pullClaviumUpdates } = await import("./clavium");

describe("clavium service", () => {
  beforeEach(() => invoke.mockReset());

  it("push trimite id-urile către clavium-sync și întoarce câte au fost trimise", async () => {
    invoke.mockResolvedValue({ data: { success: true, pushed: 2 }, error: null });
    const pushed = await pushListingsToClavium(["a", "b"]);
    expect(invoke).toHaveBeenCalledWith("clavium-sync", { body: { action: "push", listingIds: ["a", "b"] } });
    expect(pushed).toBe(2);
  });

  it("pull cere actualizările din Clavium", async () => {
    invoke.mockResolvedValue({ data: { success: true, updated: 5 }, error: null });
    expect(await pullClaviumUpdates()).toBe(5);
    expect(invoke).toHaveBeenCalledWith("clavium-sync", { body: { action: "pull", since: undefined } });
  });

  it("ridică mesajul de la 501 „nu e configurat”, nu eroarea generică supabase-js", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("Edge Function returned a non-2xx status code"), {
        context: { json: async () => ({ error: "Integrarea Clavium nu este configurată.", configured: false }) },
      }),
    });
    await expect(pushListingsToClavium(["a"])).rejects.toThrow("Integrarea Clavium nu este configurată.");
  });

  it("propagă eroarea originală când corpul nu poate fi citit", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("network down") });
    await expect(pushListingsToClavium(["a"])).rejects.toThrow("network down");
  });
});
