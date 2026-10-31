function fractionDigitsFor(currency: string): number {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
}

export function formatMoney(
  amountInMinorUnits: number | null,
  currency: string,
  locale = "en-US",
): string {
  if (amountInMinorUnits === null) return "—";

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;

  return formatter.format(amountInMinorUnits / 10 ** fractionDigits);
}

// "1,500.5" → 150050 for USD. Returns null when the text isn't a valid amount
// (negative, too many decimals for the currency, not a number).
export function parseMoney(input: string, currency: string): number | null {
  const fractionDigits = fractionDigitsFor(currency);
  const text = input.trim().replaceAll(",", "");
  const pattern = fractionDigits > 0 ? new RegExp(`^\\d+(\\.\\d{0,${fractionDigits}})?$`) : /^\d+$/;
  if (!pattern.test(text)) return null;

  const [whole, fraction = ""] = text.split(".");
  // String math avoids float rounding (e.g. 19.99 * 100 = 1998.9999…)
  return Number(whole + fraction.padEnd(fractionDigits, "0"));
}

// Inverse of parseMoney for pre-filling inputs: 150050 → "1500.50"
export function toMoneyInput(amountInMinorUnits: number | null, currency: string): string {
  if (amountInMinorUnits === null) return "";
  const fractionDigits = fractionDigitsFor(currency);
  return (amountInMinorUnits / 10 ** fractionDigits).toFixed(fractionDigits);
}
