import { describe, it, expect } from "vitest";
import { todayInRome, isEventOver } from "../dates";

describe("todayInRome", () => {
  it("uses the Italian calendar day, not UTC", () => {
    // 23:30 UTC on 1 March is already 2 March in Rome (UTC+1)
    expect(todayInRome(new Date("2026-03-01T23:30:00Z"))).toBe("2026-03-02");
  });

  it("formats as YYYY-MM-DD", () => {
    expect(todayInRome(new Date("2026-07-15T10:00:00Z"))).toBe("2026-07-15");
  });
});

describe("isEventOver", () => {
  const today = "2026-05-02";

  it("keeps a multi-day event that started yesterday and ends today", () => {
    expect(isEventOver({ date: "2026-05-01", endDate: "2026-05-02" }, today)).toBe(false);
  });

  it("removes an event whose last day has passed", () => {
    expect(isEventOver({ date: "2026-04-28", endDate: "2026-05-01" }, today)).toBe(true);
  });

  it("falls back to the start date when endDate is missing", () => {
    expect(isEventOver({ date: "2026-05-01" }, today)).toBe(true);
    expect(isEventOver({ date: "2026-05-02" }, today)).toBe(false);
  });
});
