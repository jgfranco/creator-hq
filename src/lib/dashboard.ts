import "server-only";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";
import { addDays, today } from "./dates";
import { sumPayments } from "./invoices";
import { CampaignStatus } from "@/generated/prisma/enums";

// How far ahead "coming up" looks
export const UPCOMING_DAYS = 14;

// Pipeline stages, in order: still being won, won but not yet billed
const OPEN_STATUSES: CampaignStatus[] = ["LEAD", "NEGOTIATING"];
const BOOKED_STATUSES: CampaignStatus[] = [
  "CONTRACTED",
  "IN_PRODUCTION",
  "POSTED",
];

function monthStart(date: Date, monthsAgo = 0) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - monthsAgo, 1),
  );
}

export async function getDashboard() {
  const { workspaceId } = await getCurrentMembership();
  const now = today();
  const thisMonth = monthStart(now);
  const lastMonth = monthStart(now, 1);
  const horizon = addDays(now, UPCOMING_DAYS);

  const [byStatus, unpaidInvoices, recentPayments, deliverables] =
    await Promise.all([
      prisma.campaign.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: { _all: true },
        _sum: { feeCents: true },
      }),
      prisma.invoice.findMany({
        where: { workspaceId, status: { in: ["SENT", "PARTIALLY_PAID"] } },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          number: true,
          currency: true,
          dueDate: true,
          totalCents: true,
          campaign: {
            select: { title: true, brand: { select: { name: true } } },
          },
          payments: { select: { amountCents: true } },
        },
      }),
      prisma.payment.findMany({
        where: { invoice: { workspaceId }, paidOn: { gte: lastMonth } },
        select: {
          amountCents: true,
          paidOn: true,
          invoice: { select: { currency: true } },
        },
      }),
      // Not finished, and due within the horizon or already late
      prisma.deliverable.findMany({
        where: {
          campaign: { workspaceId },
          status: { notIn: ["POSTED", "CANCELLED"] },
          dueDate: { lte: horizon },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 15,
        select: {
          id: true,
          type: true,
          platform: true,
          status: true,
          dueDate: true,
          campaign: {
            select: {
              id: true,
              title: true,
              brand: { select: { name: true } },
            },
          },
        },
      }),
    ]);

  // Every status, in pipeline order, even ones with no campaigns
  const pipeline = Object.values(CampaignStatus).map((status) => {
    const row = byStatus.find((r) => r.status === status);
    return {
      status,
      count: row?._count._all ?? 0,
      feeCents: row?._sum.feeCents ?? 0,
    };
  });
  const stage = (statuses: CampaignStatus[]) => {
    const rows = pipeline.filter((r) => statuses.includes(r.status));
    return {
      count: rows.reduce((n, r) => n + r.count, 0),
      feeCents: rows.reduce((n, r) => n + r.feeCents, 0),
    };
  };

  const balances = unpaidInvoices.map((invoice) => ({
    ...invoice,
    balanceCents: invoice.totalCents - sumPayments(invoice.payments),
  }));
  const toAmount = (b: (typeof balances)[number]) => ({
    cents: b.balanceCents,
    currency: b.currency,
  });
  const overdue = balances.filter((b) => b.dueDate < now);

  const paid = (from: Date, to?: Date) =>
    recentPayments
      .filter((p) => p.paidOn >= from && (!to || p.paidOn < to))
      .map((p) => ({ cents: p.amountCents, currency: p.invoice.currency }));

  return {
    pipeline,
    open: stage(OPEN_STATUSES),
    booked: stage(BOOKED_STATUSES),
    outstanding: { amounts: balances.map(toAmount), count: balances.length },
    overdue: { amounts: overdue.map(toAmount), count: overdue.length },
    paidThisMonth: paid(thisMonth),
    paidLastMonth: paid(lastMonth, thisMonth),
    upcomingDeliverables: deliverables,
    // Overdue first, then due within the horizon
    upcomingInvoices: balances.filter((b) => b.dueDate <= horizon).slice(0, 15),
    today: now,
  };
}
