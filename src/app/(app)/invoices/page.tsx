import { Suspense } from "react";
import Link from "next/link";
import {
  INVOICE_FILTERS,
  listInvoices,
  sumPayments,
  type InvoiceFilter,
} from "@/lib/invoices";
import { formatInvoiceNumber, isOverdue } from "@/lib/invoice-rules";
import { formatMoney } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
import { formatEnum } from "@/lib/format";
import { FilterTab } from "../filter-tab";
import { InvoiceStatusBadge } from "./status-badge";

export default function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded bg-gray-900 px-3 py-2 text-sm text-gray-50"
        >
          New invoice
        </Link>
      </div>

      <Suspense
        fallback={<p className="text-sm text-gray-500">Loading invoices…</p>}
      >
        <InvoicesView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// Totals per currency, e.g. "$1,200.00 + €300.00" (invoices keep their own currency)
function formatTotals(amounts: { cents: number; currency: string }[]) {
  const byCurrency = new Map<string, number>();
  for (const { cents, currency } of amounts) {
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + cents);
  }
  if (byCurrency.size === 0) return formatMoney(0, "USD");
  return [...byCurrency]
    .map(([currency, cents]) => formatMoney(cents, currency))
    .join(" + ");
}

async function InvoicesView({
  searchParams,
}: {
  searchParams: PageProps<"/invoices">["searchParams"];
}) {
  const { filter: filterParam } = await searchParams;
  const filter: InvoiceFilter =
    INVOICE_FILTERS.find((f) => f === filterParam) ?? "all";

  // The summary always covers all outstanding invoices, whatever the filter
  const [invoices, outstanding] = await Promise.all([
    listInvoices({ filter }),
    listInvoices({ filter: "outstanding" }),
  ]);

  const now = today();
  const balanceOf = (invoice: (typeof outstanding)[number]) => ({
    cents: invoice.totalCents - sumPayments(invoice.payments),
    currency: invoice.currency,
  });
  const overdue = outstanding.filter((invoice) => isOverdue(invoice, now));

  return (
    <>
      <dl className="mb-6 grid max-w-md grid-cols-2 gap-4 text-sm">
        <div className="rounded border p-3">
          <dt className="text-gray-500">Outstanding</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {formatTotals(outstanding.map(balanceOf))}
          </dd>
        </div>
        <div className="rounded border p-3">
          <dt className="text-gray-500">Overdue</dt>
          <dd
            className={`mt-1 text-lg font-semibold tabular-nums ${overdue.length ? "text-red-700" : ""}`}
          >
            {formatTotals(overdue.map(balanceOf))}
          </dd>
        </div>
      </dl>

      <div className="mb-4 flex flex-wrap gap-1 text-sm">
        {INVOICE_FILTERS.map((f) => (
          <FilterTab
            key={f}
            href={f === "all" ? "/invoices" : `/invoices?filter=${f}`}
            active={filter === f}
          >
            {formatEnum(f)}
          </FilterTab>
        ))}
      </div>

      {invoices.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
          {filter === "all"
            ? "No invoices yet. Create one from a campaign to bill the brand."
            : `No ${filter} invoices.`}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2 font-medium">Invoice</th>
              <th className="py-2 font-medium">Billed to</th>
              <th className="py-2 font-medium">Issued</th>
              <th className="py-2 font-medium">Due</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Total</th>
              <th className="py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const balance =
                invoice.totalCents - sumPayments(invoice.payments);
              const owed =
                invoice.status === "SENT" ||
                invoice.status === "PARTIALLY_PAID";
              return (
                <tr key={invoice.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="hover:underline"
                    >
                      {formatInvoiceNumber(invoice.number)}
                    </Link>
                  </td>
                  <td className="py-2">
                    {invoice.campaign.brand.name}
                    <span className="block text-xs text-gray-500">
                      {invoice.campaign.title}
                    </span>
                  </td>
                  <td className="py-2">{formatDate(invoice.issueDate)}</td>
                  <td className="py-2">{formatDate(invoice.dueDate)}</td>
                  <td className="py-2">
                    <InvoiceStatusBadge
                      status={invoice.status}
                      dueDate={invoice.dueDate}
                    />
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMoney(invoice.totalCents, invoice.currency)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {owed ? formatMoney(balance, invoice.currency) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
