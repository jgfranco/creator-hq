// Pure invoice rules (no database), shared by server actions and pages.
import type { CampaignStatus, InvoiceStatus } from "@/generated/prisma/enums";

export const MAX_LINE_ITEMS = 50;

export function formatInvoiceNumber(number: number | null): string {
  return number === null ? "Draft" : `INV-${String(number).padStart(4, "0")}`;
}

export function lineItemsTotal(
  items: { quantity: number; unitAmountCents: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmountCents,
    0,
  );
}

export const isEditable = (status: InvoiceStatus) => status === "DRAFT";
export const acceptsPayments = (status: InvoiceStatus) =>
  status === "SENT" || status === "PARTIALLY_PAID";

// Status of a sent invoice given what's been paid so far
export function statusForPayments(
  totalCents: number,
  paidCents: number,
): InvoiceStatus {
  if (paidCents >= totalCents) return "PAID";
  if (paidCents > 0) return "PARTIALLY_PAID";
  return "SENT";
}

// Overdue is derived, not stored: still owed and past the due date
export function isOverdue(
  invoice: { status: InvoiceStatus; dueDate: Date },
  today: Date,
): boolean {
  return acceptsPayments(invoice.status) && invoice.dueDate < today;
}

// Campaign statuses in pipeline order; automation only ever moves a campaign forward.
const CAMPAIGN_PIPELINE: CampaignStatus[] = [
  "LEAD",
  "NEGOTIATING",
  "CONTRACTED",
  "IN_PRODUCTION",
  "POSTED",
  "INVOICED",
  "PAID",
];

export function advanceCampaignStatus(
  current: CampaignStatus,
  target: "INVOICED" | "PAID",
): CampaignStatus {
  if (current === "CANCELLED") return current;
  return CAMPAIGN_PIPELINE.indexOf(current) < CAMPAIGN_PIPELINE.indexOf(target)
    ? target
    : current;
}

// A campaign is paid once it has at least one sent invoice and every sent one is paid.
// Drafts and voided invoices don't count either way.
export function campaignFullyPaid(
  invoices: { status: InvoiceStatus }[],
): boolean {
  const issued = invoices.filter(
    (i) => i.status !== "DRAFT" && i.status !== "VOID",
  );
  return issued.length > 0 && issued.every((i) => i.status === "PAID");
}
