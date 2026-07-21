import { describe, expect, it } from "vitest";
import { bulkDeleteListings, bulkUpdateStatus } from "./bulkOperations";
import { makeListing } from "../testing/makeListing";

describe("bulkOperations", () => {
  const items = [
    makeListing({ id: "a", status: "new" }),
    makeListing({ id: "b", status: "new" }),
    makeListing({ id: "c", status: "contacted" }),
  ];

  it("bulkUpdateStatus schimbă doar id-urile țintă", () => {
    const out = bulkUpdateStatus(items, ["a", "c"], "closed");
    expect(out.map((l) => l.status)).toEqual(["closed", "new", "closed"]);
    expect(items[0].status).toBe("new");
  });

  it("bulkDeleteListings elimină doar id-urile țintă", () => {
    const out = bulkDeleteListings(items, ["b"]);
    expect(out.map((l) => l.id)).toEqual(["a", "c"]);
  });
});
