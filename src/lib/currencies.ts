// ISO 4217 codes the runtime can format, e.g. "USD", "EUR"
export const CURRENCY_CODES: readonly string[] =
  Intl.supportedValuesOf("currency");

// Options for a currency <select>, built on the server so labels match exactly
export function currencyOptions() {
  const names = new Intl.DisplayNames("en-US", { type: "currency" });
  return CURRENCY_CODES.map((code) => ({
    code,
    label: `${code} — ${names.of(code) ?? code}`,
  }));
}
