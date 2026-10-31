import { z } from "zod";
import {
  DeliverableStatus,
  DeliverableType,
  Platform,
} from "@/generated/prisma/enums";
import { optionalDate, optionalText, optionalUrl } from "./fields";

export const deliverableSchema = z.object({
  type: z.enum(DeliverableType, { error: "Choose a type" }),
  platform: z.enum(Platform, { error: "Choose a platform" }),
  status: z.enum(DeliverableStatus, { error: "Choose a status" }),
  dueDate: optionalDate,
  scheduledFor: optionalDate,
  postedAt: optionalDate,
  liveUrl: optionalUrl,
  revisionCount: z
    .string()
    .trim()
    .regex(/^\d*$/, "Enter a whole number, 0 or more")
    .transform((value) => (value === "" ? 0 : Number(value)))
    .pipe(z.number().max(99, "Revision count can't exceed 99")),
  notes: optionalText(2000, "Notes"),
});

export type DeliverableInput = z.infer<typeof deliverableSchema>;
