import { describe, expect, it } from "vitest";
import { daysUntilPurge, TRASH_RETENTION_DAYS } from "./purgeCountdown";

describe("daysUntilPurge", () => {
  const now = new Date("2026-07-23T12:00:00Z");

  it("un anunț tocmai șters are întreaga fereastră", () => {
    expect(daysUntilPurge("2026-07-23T11:00:00Z", now)).toBe(TRASH_RETENTION_DAYS);
  });

  it("scade pe măsură ce trece timpul, rotunjind în sus", () => {
    expect(daysUntilPurge("2026-07-13T12:00:00Z", now)).toBe(20); // exact 10 zile trecute
    expect(daysUntilPurge("2026-07-13T18:00:00Z", now)).toBe(21); // 9,75 zile trecute → ceil(20,25)
  });

  it("nu coboară sub zero pentru rânduri care așteaptă purjarea", () => {
    expect(daysUntilPurge("2026-05-01T12:00:00Z", now)).toBe(0);
  });

  it("tolerează o dată invalidă", () => {
    expect(daysUntilPurge("nu-e-o-dată", now)).toBe(TRASH_RETENTION_DAYS);
  });
});
