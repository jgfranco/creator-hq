import { Suspense } from "react";
import Link from "next/link";
import { getInvoice, sumPayments } from "@/lib/invoices";
import { getCurrentMembership } from "@/lib/workspace";
import { acceptsPayments, formatInvoiceNumber } from "@/lib/invoice-rules";
import { formatMoney, toMoneyInput } from "@/lib/money";
import { formatDate, toDateInput, today } from "@/lib/dates";
import { formatEnum } from "@/lib/format";
import { ActionButton, DeleteButton } from "../../action-button";
import { InvoiceStatusBadge } from "../status-badge";
import {
  deleteInvoice,
  deletePayment,
  recordPayment,
  sendInvoice,
  voidInvoice,
} from "../actions";
import { PaymentForm } from "./payment-form";
import { PrintButton } from "./print-button";

export default function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  return (
    <div>
      <Link
        href="/invoices"
        className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-950 print:hidden"
      >
        ← Invoices
      </Link>
      <Suspense
        fallback={<p className="text-sm text-gray-500">Loading invoice…</p>}
      >
        <InvoiceView params={params} />
      </Suspense>
    </div>
  );
}

async function InvoiceView({
  params,
}: {
  params: PageProps<"/invoices/[id]">["params"];
}) {
  const { id } = await params;
  const [invoice, membership] = await Promise.all([
    getInvoice(id),
    getCurrentMembership(),
  ]);
  const canEdit = membership.role !== "VIEWER";

  const label = formatInvoiceNumber(invoice.number);
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  const paidCents = sumPayments(invoice.payments);
  const balanceCents = invoice.totalCents - paidCents;
  const contact = invoice.campaign.brand.contacts[0];

  return (
    <>
      {/* Actions */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{label}</h1>
          <InvoiceStatusBadge
            status={invoice.status}
            dueDate={invoice.dueDate}
          />
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <PrintButton />
          {canEdit && invoice.status === "DRAFT" && (
            <>
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Edit
              </Link>
              <DeleteButton
                action={deleteInvoice.bind(null, invoice.id)}
                confirmMessage="Delete this draft invoice? This can't be undone."
              />
              <ActionButton
                action={sendInvoice.bind(null, invoice.id)}
                label="Mark as sent"
                pendingLabel="Sending…"
                variant="primary"
                confirmMessage="Mark this invoice as sent? It gets the next invoice number and can no longer be edited."
              />
            </>
          )}
          {canEdit &&
            (invoice.status === "SENT" ||
              invoice.status === "PARTIALLY_PAID") && (
              <ActionButton
                action={voidInvoice.bind(null, invoice.id)}
                label="Void"
                pendingLabel="Voiding…"
                variant="danger"
                confirmMessage={`Void ${label}? It stays on record but no longer counts as owed.`}
              />
            )}
        </div>
      </div>

      {/* The invoice document (what gets printed) */}
      <article className="rounded border p-8 print:border-0 print:p-0">
        <header className="mb-8 flex justify-between gap-8">
          <div>
            <p className="text-xs tracking-wide text-gray-500 uppercase">
              From
            </p>
            <p className="font-medium">{invoice.workspace.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold">
              Invoice {invoice.number === null ? "(draft)" : label}
            </p>
            <p className="text-sm text-gray-600">
              Issued {formatDate(invoice.issueDate)}
            </p>
            <p className="text-sm text-gray-600">
              Due {formatDate(invoice.dueDate)}
            </p>
          </div>
        </header>

        <div className="mb-8">
          <p className="text-xs tracking-wide text-gray-500 uppercase">
            Bill to
          </p>
          <p className="font-medium">{invoice.campaign.brand.name}</p>
          {contact && (
            <p className="text-sm text-gray-600">
              {contact.name}
              {contact.email && ` · ${contact.email}`}
            </p>
          )}
          <p className="text-sm text-gray-600">
            Re:{" "}
            <Link
              href={`/campaigns/${invoice.campaign.id}`}
              className="underline print:no-underline"
            >
              {invoice.campaign.title}
            </Link>
          </p>
        </div>

        <table className="mb-6 w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {money(item.unitAmountCents)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {money(item.quantity * item.unitAmountCents)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="tabular-nums">
            <tr>
              <td colSpan={3} className="pt-3 text-right font-medium">
                Total
              </td>
              <td className="pt-3 text-right font-semibold">
                {money(invoice.totalCents)}
              </td>
            </tr>
            {paidCents > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-gray-600">
                    Paid
                  </td>
                  <td className="pt-1 text-right text-gray-600">
                    −{money(paidCents)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="pt-1 text-right font-medium">
                    Balance due
                  </td>
                  <td className="pt-1 text-right font-semibold">
                    {money(balanceCents)}
                  </td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        {invoice.notes && (
          <p className="text-sm whitespace-pre-line text-gray-700">
            {invoice.notes}
          </p>
        )}
      </article>

      {/* Payments */}
      {invoice.status !== "DRAFT" && (
        <section className="mt-8 print:hidden">
          <h2 className="mb-3 text-lg font-semibold">Payments</h2>
          {invoice.payments.length === 0 ? (
            <p className="mb-4 text-sm text-gray-500">No payments recorded.</p>
          ) : (
            <table className="mb-4 w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Method</th>
                  <th className="py-2 font-medium">Reference</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                  {canEdit && <th className="py-2" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-2">{formatDate(payment.paidOn)}</td>
                    <td className="py-2">{formatEnum(payment.method)}</td>
                    <td className="py-2 text-gray-600">
                      {payment.reference ?? "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {money(payment.amountCents)}
                    </td>
                    {canEdit && (
                      <td className="py-2 text-right">
                        <DeleteButton
                          action={deletePayment.bind(
                            null,
                            invoice.id,
                            payment.id,
                          )}
                          confirmMessage={`Remove this ${money(payment.amountCents)} payment?`}
                          label="Remove"
                          size="sm"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {canEdit && acceptsPayments(invoice.status) && (
            <PaymentForm
              action={recordPayment.bind(null, invoice.id)}
              currency={invoice.currency}
              defaultValues={{
                amount: toMoneyInput(balanceCents, invoice.currency),
                paidOn: toDateInput(today()),
                method: "BANK_TRANSFER",
                reference: "",
              }}
            />
          )}
        </section>
      )}
    </>
  );
}
