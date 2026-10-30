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
