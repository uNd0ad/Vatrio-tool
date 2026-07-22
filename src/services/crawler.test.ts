import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
vi.mock("../lib/supabaseClient", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

const { triggerCrawl } = await import("./crawler");

describe("triggerCrawl", () => {
  beforeEach(() => invoke.mockReset());

  it("apelează Edge Function-ul trigger-crawl și întoarce mesajul lui", async () => {
    invoke.mockResolvedValue({ data: { success: true, message: "Crawlerul a fost pornit." }, error: null });
    const result = await triggerCrawl();
    expect(invoke).toHaveBeenCalledWith("trigger-crawl", { body: {} });
    expect(result.message).toBe("Crawlerul a fost pornit.");
  });

  it("ridică mesajul explicativ din corpul răspunsului la 429, nu eroarea generică", async () => {
    // supabase-js raportează statusul non-2xx ca eroare generică
    // ("Edge Function returned a non-2xx status code"); motivul util e în corp.
    invoke.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("Edge Function returned a non-2xx status code"), {
        context: { json: async () => ({ error: "Un crawl este deja în curs." }) },
      }),
    });
    await expect(triggerCrawl()).rejects.toThrow("Un crawl este deja în curs.");
  });

  it("propagă eroarea originală când corpul nu poate fi citit", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("network down") });
    await expect(triggerCrawl()).rejects.toThrow("network down");
  });

  it("tratează un corp cu câmpul error ca eșec", async () => {
    invoke.mockResolvedValue({ data: { error: "Declanșarea nu este configurată." }, error: null });
    await expect(triggerCrawl()).rejects.toThrow("Declanșarea nu este configurată.");
  });
});
