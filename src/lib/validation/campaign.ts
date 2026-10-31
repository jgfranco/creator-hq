import { z } from "zod";
import { CampaignStatus } from "@/generated/prisma/enums";
import { parseMoney } from "@/lib/money";
import { optionalDate } from "./fields";

// Factory because the fee's allowed decimals depend on the workspace currency.
export function campaignSchema(currency: string) {
  return (
    z
      .object({
        title: z
          .string()
          .trim()
          .min(1, "Title is required")
          .max(150, "Title must be 150 characters or fewer"),
        brandId: z.string().min(1, "Choose a brand"),
        status: z.enum(CampaignStatus, { error: "Choose a status" }),
        fee: z
          .string()
          .trim()
          .transform((value, ctx) => {
            if (value === "") return null;
            const cents = parseMoney(value, currency);
            if (cents === null) {
              ctx.addIssue({
                code: "custom",
                message: "Enter an amount, like 1500 or 1500.00",
              });
              return z.NEVER;
            }
            return cents;
          })
          .refine(
            (cents) => cents === null || cents <= 2_000_000_000,
            "Fee is too large",
          ),
        startDate: optionalDate,
        endDate: optionalDate,
      })
      // `when` runs this even if other fields failed (so all errors show at once);
      // a failed date field leaves its raw string behind, so only compare real Dates.
      .refine(
        ({ startDate, endDate }) =>
          !(startDate instanceof Date) ||
          !(endDate instanceof Date) ||
          endDate >= startDate,
        {
          message: "End date can't be before the start date",
          path: ["endDate"],
          when: () => true,
        },
      )
      .transform(({ fee, ...rest }) => ({ ...rest, feeCents: fee }))
  );
}

export type CampaignInput = z.infer<ReturnType<typeof campaignSchema>>;
