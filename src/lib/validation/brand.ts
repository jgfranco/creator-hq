import { z } from "zod";

const emptyToNull = (value: string) => (value === "" ? null : value);

export const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  website: z
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
    .transform(emptyToNull),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2,000 characters or fewer")
    .transform(emptyToNull),
});

export type BrandInput = z.infer<typeof brandSchema>;