import { describe, expect, it } from "vitest";
import { addDays, formatDate, parseDateInput, toDateInput } from "./dates";

describe("calendar dates", () => {
  it("stores a day as UTC midnight and round-trips it", () => {
    const date = parseDateInput("2026-11-05");
    expect(date.toISOString()).toBe("2026-11-05T00:00:00.000Z");
    expect(toDateInput(date)).toBe("2026-11-05");
    expect(toDateInput(null)).toBe("");
  });

  it("formats in UTC so the day never shifts by time zone", () => {
    expect(formatDate(parseDateInput("2026-01-01"))).toBe("Jan 1, 2026");
    expect(formatDate(null)).toBe("—");
  });

  it("adds days across month and year ends", () => {
    expect(toDateInput(addDays(parseDateInput("2026-12-25"), 14))).toBe(
      "2027-01-08",
    );
  });
});
