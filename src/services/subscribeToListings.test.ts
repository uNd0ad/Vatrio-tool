import { beforeEach, describe, expect, it, vi } from "vitest";

// Capturează handlerele înregistrate cu `.on(event, filter, handler)` pe canal.
type Handler = (payload: Record<string, unknown>) => void;
const handlers: Record<string, Handler> = {};

const channel = {
  on(_event: string, filter: { event: string }, handler: Handler) {
    handlers[filter.event] = handler;
    return channel;
  },
  subscribe() {
    return channel;
  },
};

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    channel: () => channel,
    removeChannel: vi.fn(),
  },
}));

const { subscribeToListings } = await import("./listings");

function activeRow(id: string) {
  return { id, title: "Anunț", status: "new", deleted_at: null, seller_type: "owner", transaction_type: "sale" };
}

describe("subscribeToListings realtime routing", () => {
  beforeEach(() => {
    for (const key of Object.keys(handlers)) delete handlers[key];
  });

  it("un UPDATE care setează deleted_at scoate anunțul (nu îl actualizează)", () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    subscribeToListings(vi.fn(), onUpdate, onRemove);

    // Aceasta e forma pe care o are un soft delete în realtime.
    handlers.UPDATE({ new: { ...activeRow("l-1"), deleted_at: "2026-07-23T10:00:00Z" } });

    expect(onRemove).toHaveBeenCalledWith("l-1");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("un UPDATE obișnuit actualizează, fără să scoată", () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    subscribeToListings(vi.fn(), onUpdate, onRemove);

    handlers.UPDATE({ new: { ...activeRow("l-2"), status: "contacted" } });

    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onUpdate.mock.calls[0][0].id).toBe("l-2");
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("un eveniment DELETE scoate anunțul", () => {
    const onRemove = vi.fn();
    subscribeToListings(vi.fn(), vi.fn(), onRemove);

    handlers.DELETE({ old: { id: "l-3" } });

    expect(onRemove).toHaveBeenCalledWith("l-3");
  });
});
