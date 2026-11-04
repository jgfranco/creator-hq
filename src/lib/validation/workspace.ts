import { z } from "zod";
import { Role } from "@/generated/prisma/enums";
import { CURRENCY_CODES } from "@/lib/currencies";

export const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .refine((code) => CURRENCY_CODES.includes(code), "Choose a currency"),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, "Email is too long")
    .pipe(z.email("Enter a valid email address")),
  role: z.enum(Role, { error: "Choose a role" }),
});

export const roleSchema = z.enum(Role, { error: "Choose a role" });
