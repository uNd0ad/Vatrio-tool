import { describe, expect, it } from "vitest";
import { STATUS_ICONS, STATUS_LABELS, sellerTypeLabel, transactionTypeLabel } from "./listingDisplay";
import type { ListingStatus } from "../types";

describe("listingDisplay", () => {
  it("are etichetă și pictogramă pentru fiecare status", () => {
    const statuses: ListingStatus[] = ["new", "contacted", "refused", "closed"];
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeTruthy();
      expect(STATUS_ICONS[s]).toBeTruthy();
    }
  });

  it("traduce tipurile de vânzător", () => {
    expect(sellerTypeLabel("owner")).toBe("Proprietar");
    expect(sellerTypeLabel("agency")).toBe("Agenție");
    expect(sellerTypeLabel("developer")).toBe("Dezvoltator");
    expect(sellerTypeLabel("unknown")).toBe("Necunoscut");
  });

  it("traduce tipul tranzacției", () => {
    expect(transactionTypeLabel("sale")).toBe("De vânzare");
    expect(transactionTypeLabel("rent")).toBe("De închiriat");
  });
});
