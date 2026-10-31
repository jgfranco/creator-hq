"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  getCurrentMembership,
  requireRole,
  ForbiddenError,
} from "@/lib/workspace";
import {
  invoiceSchema,
  paymentSchema,
  type InvoiceInput,
} from "@/lib/validation/invoice";
import {
  acceptsPayments,
  advanceCampaignStatus,
  campaignFullyPaid,
  lineItemsTotal,
  statusForPayments,
} from "@/lib/invoice-rules";
import { formatMoney } from "@/lib/money";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

// Result for button-triggered actions; an error is shown next to the button
export type ActionResult = { error?: string } | void;

export type LineItemValues = {
  description: string;
  quantity: string;
  unitPrice: string;
};
export type InvoiceValues = {
  issueDate: string;
  dueDate: string;
  notes: string;
  lineItems: LineItemValues[];
};
export type InvoiceFormState = {
  message?: string;
  // Keys are field paths, e.g. "dueDate" or "lineItems.0.description"
  fieldErrors?: Record<string, string[]>;
  values?: InvoiceValues;
};

export type PaymentValues = {
  amount: string;
  paidOn: string;
  method: string;
  reference: string;
};
export type PaymentFormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: PaymentValues;
  // Bumped on success so the client can reset the form
  savedAt?: number;
};

function errorsByPath(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    (errors[issue.path.join(".")] ??= []).push(issue.message);
  }
  return errors;
}

async function requireEditor() {
  const membership = await getCurrentMembership();
  requireRole(membership, ["OWNER", "MANAGER"]);
  return membership;
}

function revalidateInvoice(invoiceId: string, campaignId: string) {
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}

// Lock the invoice row for the rest of the transaction, so concurrent payments,
// sends and voids on the same invoice run one at a time.
async function lockInvoice(tx: Tx, id: string, workspaceId: string) {
  await tx.$executeRaw`SELECT 1 FROM "Invoice" WHERE id = ${id} AND "workspaceId" = ${workspaceId} FOR UPDATE`;
  return tx.invoice.findFirst({
    where: { id, workspaceId },
    select: {
      id: true,
      status: true,
      currency: true,
      totalCents: true,
      campaignId: true,
      payments: { select: { amountCents: true } },
    },
  });
}

// After an invoice's status changes, move its campaign forward if warranted.
async function syncCampaignStatus(tx: Tx, campaignId: string) {
  const campaign = await tx.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { status: true, invoices: { select: { status: true } } },
  });
  const issued = campaign.invoices.some(
    (i) => i.status !== "DRAFT" && i.status !== "VOID",
  );
  if (!issued) return;

  const target = campaignFullyPaid(campaign.invoices) ? "PAID" : "INVOICED";
  const next = advanceCampaignStatus(campaign.status, target);
  if (next !== campaign.status) {
    await tx.campaign.update({
      where: { id: campaignId },
      data: { status: next },
    });
  }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

function readInvoiceValues(formData: FormData): InvoiceValues {
  const descriptions = formData.getAll("lineItems.description").map(String);
  const quantities = formData.getAll("lineItems.quantity").map(String);
  const prices = formData.getAll("lineItems.unitPrice").map(String);
  return {
    issueDate: String(formData.get("issueDate") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    lineItems: descriptions.map((description, i) => ({
      description,
      quantity: quantities[i] ?? "",
      unitPrice: prices[i] ?? "",
    })),
  };
}

type InvoiceWrite =
  | { ok: true; data: InvoiceInput; totalCents: number }
  | { ok: false; state: InvoiceFormState };

function parseInvoice(values: InvoiceValues, currency: string): InvoiceWrite {
  const parsed = invoiceSchema(currency).safeParse({
    ...values,
    lineItems: values.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitAmountCents: item.unitPrice,
    })),
  });
  if (!parsed.success) {
    return {
      ok: false,
      state: { fieldErrors: errorsByPath(parsed.error), values },
    };
  }
  return {
    ok: true,
    data: parsed.data,
    totalCents: lineItemsTotal(parsed.data.lineItems),
  };
}

const lineItemRows = (data: InvoiceInput) =>
  data.lineItems.map((item, position) => ({ ...item, position }));

export async function createInvoice(
  campaignId: string,
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const values = readInvoiceValues(formData);

  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER", "MANAGER"]);
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { message: error.message, values };
    throw error;
  }

  // campaignId is bound from the URL, so confirm it belongs to the caller's workspace
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspaceId: membership.workspaceId,
      status: { not: "CANCELLED" },
    },
    select: { id: true },
  });
  if (!campaign) notFound();

  const currency = membership.workspace.currency;
  const write = parseInvoice(values, currency);
  if (!write.ok) return write.state;

  const { id } = await prisma.invoice.create({
    data: {
      issueDate: write.data.issueDate,
      dueDate: write.data.dueDate,
      notes: write.data.notes,
      currency,
      totalCents: write.totalCents,
      workspaceId: membership.workspaceId,
      campaignId: campaign.id,
      lineItems: { create: lineItemRows(write.data) },
    },
    select: { id: true },
  });

  revalidateInvoice(id, campaign.id);
  redirect(`/invoices/${id}`);
}

export async function updateInvoice(
  id: string,
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const values = readInvoiceValues(formData);

  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER", "MANAGER"]);
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { message: error.message, values };
    throw error;
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, workspaceId: membership.workspaceId },
    select: { status: true, currency: true, campaignId: true },
  });
  if (!existing) notFound();

  const write = parseInvoice(values, existing.currency);
  if (!write.ok) return write.state;

  const updated = await prisma.$transaction(async (tx) => {
    // Status in the WHERE so an invoice sent meanwhile can't be edited
    const { count } = await tx.invoice.updateMany({
      where: { id, workspaceId: membership.workspaceId, status: "DRAFT" },
      data: {
        issueDate: write.data.issueDate,
        dueDate: write.data.dueDate,
        notes: write.data.notes,
        totalCents: write.totalCents,
      },
    });
    if (count === 0) return false;
    await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    await tx.invoiceLineItem.createMany({
      data: lineItemRows(write.data).map((row) => ({ ...row, invoiceId: id })),
    });
    return true;
  });
  if (!updated) {
    return {
      message:
        "Only draft invoices can be edited. This one has already been sent.",
      values,
    };
  }

  revalidateInvoice(id, existing.campaignId);
  redirect(`/invoices/${id}`);
}

export async function sendInvoice(id: string): Promise<ActionResult> {
  const membership = await requireEditor();

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await lockInvoice(tx, id, membership.workspaceId);
    if (!invoice) return { notFound: true } as const;
    if (invoice.status !== "DRAFT")
      return { error: "This invoice has already been sent." };
    if (invoice.totalCents <= 0)
      return { error: "Add an amount before sending — the total is zero." };

    // Incrementing locks the workspace row, so concurrent sends get distinct numbers.
    // Inside the transaction, a later failure rolls the counter back: no gaps.
    const { nextInvoiceNumber } = await tx.workspace.update({
      where: { id: membership.workspaceId },
      data: { nextInvoiceNumber: { increment: 1 } },
      select: { nextInvoiceNumber: true },
    });
    await tx.invoice.update({
      where: { id },
      data: {
        status: "SENT",
        number: nextInvoiceNumber - 1,
        sentAt: new Date(),
      },
    });
    await syncCampaignStatus(tx, invoice.campaignId);
    return { campaignId: invoice.campaignId };
  });

  if ("notFound" in result) notFound();
  if ("error" in result) return { error: result.error };
  revalidateInvoice(id, result.campaignId);
}

export async function voidInvoice(id: string): Promise<ActionResult> {
  const membership = await requireEditor();

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await lockInvoice(tx, id, membership.workspaceId);
    if (!invoice) return { notFound: true } as const;
    if (invoice.status === "DRAFT")
      return { error: "Drafts can be deleted instead of voided." };
    if (invoice.status === "VOID")
      return { error: "This invoice is already void." };
    if (invoice.payments.length > 0) {
      return { error: "Remove this invoice's payments before voiding it." };
    }

    await tx.invoice.update({ where: { id }, data: { status: "VOID" } });
    // Voiding the last unpaid invoice can leave the campaign fully paid
    await syncCampaignStatus(tx, invoice.campaignId);
    return { campaignId: invoice.campaignId };
  });

  if ("notFound" in result) notFound();
  if ("error" in result) return { error: result.error };
  revalidateInvoice(id, result.campaignId);
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const membership = await requireEditor();

  const invoice = await prisma.invoice.findFirst({
    where: { id, workspaceId: membership.workspaceId },
    select: { status: true, campaignId: true },
  });
  if (!invoice) notFound();

  // Status in the WHERE: only drafts (which never have payments) can be deleted
  const { count } = await prisma.invoice.deleteMany({
    where: { id, workspaceId: membership.workspaceId, status: "DRAFT" },
  });
  if (count === 0)
    return {
      error: "Only drafts can be deleted. Void a sent invoice instead.",
    };

  revalidateInvoice(id, invoice.campaignId);
  redirect("/invoices");
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function recordPayment(
  invoiceId: string,
  _prevState: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const values: PaymentValues = {
    amount: String(formData.get("amount") ?? ""),
    paidOn: String(formData.get("paidOn") ?? ""),
    method: String(formData.get("method") ?? ""),
    reference: String(formData.get("reference") ?? ""),
  };

  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER", "MANAGER"]);
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { message: error.message, values };
    throw error;
  }

  type Outcome =
    { notFound: true } | { state: PaymentFormState } | { campaignId: string };
  const result = await prisma.$transaction(async (tx): Promise<Outcome> => {
    const invoice = await lockInvoice(tx, invoiceId, membership.workspaceId);
    if (!invoice) return { notFound: true };
    if (!acceptsPayments(invoice.status)) {
      return {
        state: {
          message: "Payments can only be recorded on sent, unpaid invoices.",
          values,
        },
      };
    }

    const parsed = paymentSchema(invoice.currency).safeParse({
      amountCents: values.amount,
      paidOn: values.paidOn,
      method: values.method,
      reference: values.reference,
    });
    if (!parsed.success) {
      const errors = errorsByPath(parsed.error);
      // Form field is "amount"; the schema calls it amountCents
      if (errors.amountCents) errors.amount = errors.amountCents;
      return { state: { fieldErrors: errors, values } };
    }

    // Checked under the row lock, so two simultaneous payments can't overpay
    const balance =
      invoice.totalCents -
      invoice.payments.reduce((s, p) => s + p.amountCents, 0);
    if (parsed.data.amountCents > balance) {
      return {
        state: {
          fieldErrors: {
            amount: [
              `Can't exceed the balance due of ${formatMoney(balance, invoice.currency)}`,
            ],
          },
          values,
        },
      };
    }

    await tx.payment.create({ data: { ...parsed.data, invoiceId } });
    const paid = invoice.totalCents - balance + parsed.data.amountCents;
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: statusForPayments(invoice.totalCents, paid) },
    });
    await syncCampaignStatus(tx, invoice.campaignId);
    return { campaignId: invoice.campaignId };
  });

  if ("notFound" in result) notFound();
  if ("state" in result) return result.state;
  revalidateInvoice(invoiceId, result.campaignId);
  return { savedAt: Date.now() };
}

export async function deletePayment(
  invoiceId: string,
  paymentId: string,
): Promise<ActionResult> {
  const membership = await requireEditor();

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await lockInvoice(tx, invoiceId, membership.workspaceId);
    if (!invoice) return { notFound: true } as const;

    // invoiceId in the WHERE ties the payment to the (workspace-checked) invoice
    const payment = await tx.payment.findFirst({
      where: { id: paymentId, invoiceId },
      select: { amountCents: true },
    });
    if (!payment) return { notFound: true } as const;

    await tx.payment.delete({ where: { id: paymentId } });
    const paid =
      invoice.payments.reduce((s, p) => s + p.amountCents, 0) -
      payment.amountCents;
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: statusForPayments(invoice.totalCents, paid) },
    });
    // Campaign status only moves forward, so it isn't rolled back here
    return { campaignId: invoice.campaignId };
  });

  if ("notFound" in result) notFound();
  revalidateInvoice(invoiceId, result.campaignId);
}
