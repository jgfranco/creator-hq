import { z } from "zod";
import { parseDateInput } from "@/lib/dates";

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
