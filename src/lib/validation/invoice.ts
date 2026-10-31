import { z } from "zod";
import { PaymentMethod } from "@/generated/prisma/enums";
import { lineItemsTotal, MAX_LINE_ITEMS } from "@/lib/invoice-rules";
import { optionalText, requiredDate, requiredMoney } from "./fields";

function lineItemSchema(currency: string) {
  return z.object({
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(200, "Description must be 200 characters or fewer"),
    quantity: z
      .string()
      .trim()
      .regex(/^\d+$/, "Quantity must be a whole number")
      .transform(Number)
      .pipe(
        z
          .number()
          .min(1, "Quantity must be at least 1")
          .max(1000, "Quantity can't exceed 1,000"),
      ),
    unitAmountCents: requiredMoney(currency, "Price"),
  });
}

// Factory because money parsing depends on the invoice currency.
export function invoiceSchema(currency: string) {
  return (
    z
      .object({
        issueDate: requiredDate("Issue date"),
        dueDate: requiredDate("Due date"),
        notes: optionalText(2000, "Notes"),
        lineItems: z
          .array(lineItemSchema(currency))
          .min(1, "Add at least one line item")
          .max(
            MAX_LINE_ITEMS,
            `An invoice can have at most ${MAX_LINE_ITEMS} line items`,
          ),
      })
      // `when` runs these even if other fields failed, so all errors show at once;
      // a failed field leaves its raw value behind, so check types before comparing.
      .refine(
        ({ issueDate, dueDate }) =>
          !(issueDate instanceof Date) ||
          !(dueDate instanceof Date) ||
          dueDate >= issueDate,
        {
          message: "Due date can't be before the issue date",
          path: ["dueDate"],
          when: () => true,
        },
      )
      .refine(
        ({ lineItems }) =>
          !Array.isArray(lineItems) ||
          lineItems.some((i) => typeof i?.unitAmountCents !== "number") ||
          lineItemsTotal(lineItems) <= 2_000_000_000,
        {
          message: "Invoice total is too large",
          path: ["lineItems"],
          when: () => true,
        },
      )
  );
}

export type InvoiceInput = z.infer<ReturnType<typeof invoiceSchema>>;

export function paymentSchema(currency: string) {
  return z.object({
    amountCents: requiredMoney(currency).refine(
      (minor) => minor > 0,
      "Amount must be more than zero",
    ),
    paidOn: requiredDate("Payment date"),
    method: z.enum(PaymentMethod, { error: "Choose a payment method" }),
    reference: optionalText(200, "Reference"),
  });
}

export type PaymentInput = z.infer<ReturnType<typeof paymentSchema>>;
