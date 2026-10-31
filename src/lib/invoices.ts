import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";
import { today } from "./dates";
import type { Prisma } from "@/generated/prisma/client";

export const INVOICE_FILTERS = [
  "all",
  "draft",
  "outstanding",
  "overdue",
  "paid",
  "void",
] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

function filterWhere(filter: InvoiceFilter): Prisma.InvoiceWhereInput {
  switch (filter) {
    case "draft":
      return { status: "DRAFT" };
    case "outstanding":
      return { status: { in: ["SENT", "PARTIALLY_PAID"] } };
    case "overdue":
      return {
        status: { in: ["SENT", "PARTIALLY_PAID"] },
        dueDate: { lt: today() },
      };
    case "paid":
      return { status: "PAID" };
    case "void":
      return { status: "VOID" };
    case "all":
      return {};
  }
}

export function sumPayments(payments: { amountCents: number }[]): number {
  return payments.reduce((sum, payment) => sum + payment.amountCents, 0);
}

export async function listInvoices({
  filter = "all",
}: { filter?: InvoiceFilter } = {}) {
  const { workspaceId } = await getCurrentMembership();

  return prisma.invoice.findMany({
    where: { workspaceId, ...filterWhere(filter) },
    // Drafts (no number) first, then newest numbers first
    orderBy: [
      { number: { sort: "desc", nulls: "first" } },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      number: true,
      status: true,
      currency: true,
      issueDate: true,
      dueDate: true,
      totalCents: true,
      campaign: {
        select: { id: true, title: true, brand: { select: { name: true } } },
      },
      payments: { select: { amountCents: true } },
    },
  });
}

export async function getInvoice(id: string) {
  const { workspaceId } = await getCurrentMembership();

  const invoice = await prisma.invoice.findFirst({
    where: { id, workspaceId },
    select: {
      id: true,
      number: true,
      status: true,
      currency: true,
      issueDate: true,
      dueDate: true,
      notes: true,
      totalCents: true,
      sentAt: true,
      workspace: { select: { name: true } },
      campaign: {
        select: {
          id: true,
          title: true,
          brand: {
            select: {
              id: true,
              name: true,
              contacts: {
                where: { isPrimary: true },
                select: { name: true, email: true },
                take: 1,
              },
            },
          },
        },
      },
      lineItems: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          description: true,
          quantity: true,
          unitAmountCents: true,
        },
      },
      payments: {
        orderBy: [{ paidOn: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          amountCents: true,
          paidOn: true,
          method: true,
          reference: true,
        },
      },
    },
  });

  if (!invoice) notFound();
  return invoice;
}

// Campaigns that can be invoiced, for the "choose a campaign" step
export async function listInvoiceableCampaigns() {
  const { workspaceId } = await getCurrentMembership();

  return prisma.campaign.findMany({
    where: { workspaceId, status: { not: "CANCELLED" } },
    orderBy: [{ brand: { name: "asc" } }, { title: "asc" }],
    select: { id: true, title: true, brand: { select: { name: true } } },
  });
}

// What a new invoice for this campaign should start with: one line for the part
// of the agreed fee that hasn't been invoiced yet (ignoring voided invoices).
export async function getNewInvoiceDefaults(campaignId: string) {
  const { workspaceId } = await getCurrentMembership();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId, status: { not: "CANCELLED" } },
    select: {
      id: true,
      title: true,
      feeCents: true,
      brand: { select: { name: true } },
      invoices: {
        where: { status: { not: "VOID" } },
        select: { totalCents: true },
      },
    },
  });
  if (!campaign) notFound();

  const invoiced = campaign.invoices.reduce(
    (sum, invoice) => sum + invoice.totalCents,
    0,
  );
  const remainingCents =
    campaign.feeCents === null
      ? null
      : Math.max(campaign.feeCents - invoiced, 0);

  return { campaign, invoicedCents: invoiced, remainingCents };
}
