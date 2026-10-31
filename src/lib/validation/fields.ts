import { z } from "zod";
import { parseDateInput } from "@/lib/dates";
import { parseMoney } from "@/lib/money";

// Building blocks for form schemas: inputs arrive as strings, "" means "not set".

const emptyToNull = (value: string) => (value === "" ? null : value);

export const optionalUrl = z
  .string()
  .trim()
  .pipe(
    z.union([
      z.literal(""),
      z.url({
        protocol: /^https?$/,
        error: "Enter a full URL, like https://example.com",
      }),
    ]),
  )
  .transform(emptyToNull);

export function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(
      max,
      `${label} must be ${max.toLocaleString("en-US")} characters or fewer`,
    )
    .transform(emptyToNull);
}

// "YYYY-MM-DD" → calendar day stored as UTC midnight (see src/lib/dates.ts)
export const optionalDate = z
  .string()
  .trim()
  .pipe(z.union([z.literal(""), z.iso.date({ error: "Enter a valid date" })]))
  .transform((value) => (value === "" ? null : parseDateInput(value)));

// Upper bound keeps amounts (and quantity × amount) well inside Postgres INT
const MAX_MINOR_UNITS = 2_000_000_000;

// Money typed in the workspace currency → integer minor units (cents).
// "" → null; use requiredMoney when a value must be given.
export function optionalMoney(currency: string) {
  return z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const minor = parseMoney(value, currency);
      if (minor === null) {
        ctx.addIssue({
          code: "custom",
          message: "Enter an amount, like 1500 or 1500.00",
        });
        return z.NEVER;
      }
      return minor;
    })
    .refine(
      (minor) => minor === null || minor <= MAX_MINOR_UNITS,
      "Amount is too large",
    );
}

export function requiredMoney(currency: string, label = "Amount") {
  return optionalMoney(currency).transform((minor, ctx) => {
    if (minor === null) {
      ctx.addIssue({ code: "custom", message: `${label} is required` });
      return z.NEVER;
    }
    return minor;
  });
}

export const requiredDate = (label: string) =>
  optionalDate.transform((date, ctx) => {
    if (date === null) {
      ctx.addIssue({ code: "custom", message: `${label} is required` });
      return z.NEVER;
    }
    return date;
  });
