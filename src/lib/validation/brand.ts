import { z } from "zod";
import { optionalText, optionalUrl } from "./fields";

export const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  website: optionalUrl,
  notes: optionalText(2000, "Notes"),
});

export type BrandInput = z.infer<typeof brandSchema>;
