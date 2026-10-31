// Campaign dates are calendar days, stored as UTC midnight so they don't shift by time zone.

export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

// Date → "YYYY-MM-DD" for <input type="date">
export function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function formatDate(date: Date | null, locale = "en-US"): string {
  if (!date) return "—";
  return date.toLocaleDateString(locale, {
    timeZone: "UTC",
    dateStyle: "medium",
  });
}
