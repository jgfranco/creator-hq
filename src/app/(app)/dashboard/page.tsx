import { Suspense } from "react";
import Link from "next/link";
import { getCurrentMembership } from "@/lib/workspace";
import { getDashboard, UPCOMING_DAYS } from "@/lib/dashboard";
import { formatMoney, formatMoneyTotals } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { formatEnum, formatPlatform } from "@/lib/format";
import { formatInvoiceNumber } from "@/lib/invoice-rules";

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<div className="h-14" />}>
        <WorkspaceHeader />
      </Suspense>
      <Suspense
        fallback={
          <p className="mt-8 text-sm text-gray-500">Loading dashboard…</p>
        }
      >
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function WorkspaceHeader() {
  const membership = await getCurrentMembership();

  return (
    <header>
      <h1 className="text-2xl font-semibold">{membership.workspace.name}</h1>
      <p className="text-sm text-gray-500">
        Your role: {formatEnum(membership.role)}
      </p>
    </header>
  );
}

async function Dashboard() {
  const [membership, data] = await Promise.all([
    getCurrentMembership(),
    getDashboard(),
  ]);
  const { currency } = membership.workspace;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <div className="mt-8 space-y-10">
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="Open pipeline"
          value={formatMoney(data.open.feeCents, currency)}
          detail={`${plural(data.open.count, "deal")} in lead or negotiation`}
          href="/campaigns"
        />
        <StatTile
          label="Booked, not yet invoiced"
          value={formatMoney(data.booked.feeCents, currency)}
          detail={`${plural(data.booked.count, "deal")} contracted, in production or posted`}
          href="/campaigns"
        />
        <StatTile
          label="Outstanding"
          value={formatMoneyTotals(data.outstanding.amounts, currency)}
          detail={
            data.overdue.count > 0 ? (
              <span className="text-red-700">
                <span aria-hidden="true">⚠ </span>
                {data.overdue.count} overdue ·{" "}
                {formatMoneyTotals(data.overdue.amounts, currency)}
              </span>
            ) : (
              `${plural(data.outstanding.count, "unpaid invoice")}, none overdue`
            )
          }
          href={
            data.overdue.count > 0
              ? "/invoices?filter=overdue"
              : "/invoices?filter=outstanding"
          }
        />
        <StatTile
          label="Paid this month"
          value={formatMoneyTotals(data.paidThisMonth, currency)}
          detail={`Last month: ${formatMoneyTotals(data.paidLastMonth, currency)}`}
          href="/invoices?filter=paid"
        />
      </dl>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pipeline</h2>
        <Pipeline rows={data.pipeline} currency={currency} />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Coming up</h2>
        <p className="mb-4 text-sm text-gray-500">
          Late, or due in the next {UPCOMING_DAYS} days.
        </p>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-600">
              Deliverables
            </h3>
            {data.upcomingDeliverables.length === 0 ? (
              <Empty>
                Nothing due. Add due dates to deliverables to see them here.
              </Empty>
            ) : (
              <ul className="divide-y rounded border">
                {data.upcomingDeliverables.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/campaigns/${d.campaign.id}`}
                      className="flex items-start justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <span>
                        {formatEnum(d.type)} · {formatPlatform(d.platform)}
                        <span className="block text-xs text-gray-500">
                          {d.campaign.title} — {d.campaign.brand.name} ·{" "}
                          {formatEnum(d.status)}
                        </span>
                      </span>
                      <DueDate date={d.dueDate!} today={data.today} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-600">Invoices</h3>
            {data.upcomingInvoices.length === 0 ? (
              <Empty>No unpaid invoices due.</Empty>
            ) : (
              <ul className="divide-y rounded border">
                {data.upcomingInvoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="flex items-start justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <span>
                        {formatInvoiceNumber(invoice.number)} ·{" "}
                        <span className="tabular-nums">
                          {formatMoney(invoice.balanceCents, invoice.currency)}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {invoice.campaign.brand.name} —{" "}
                          {invoice.campaign.title}
                        </span>
                      </span>
                      <DueDate date={invoice.dueDate} today={data.today} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: React.ReactNode;
  href: string;
}) {
  return (
    <div className="rounded border">
      <Link href={href} className="block h-full p-4 hover:bg-gray-50">
        <dt className="text-sm text-gray-500">{label}</dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
        <dd className="mt-1 text-xs text-gray-500">{detail}</dd>
      </Link>
    </div>
  );
}

// One row per status with a thin bar for its share of the largest stage's fees.
// One hue throughout; cancelled deals are grayed out since they're no longer in play.
function Pipeline({
  rows,
  currency,
}: {
  rows: { status: string; count: number; feeCents: number }[];
  currency: string;
}) {
  const max = Math.max(...rows.map((r) => r.feeCents), 1);

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b text-gray-500">
        <tr>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 text-right font-medium">Deals</th>
          <th className="py-2 pl-6 font-medium">
            <span className="sr-only">Share of fees</span>
          </th>
          <th className="py-2 text-right font-medium">Fees</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const width = (row.feeCents / max) * 100;
          const cancelled = row.status === "CANCELLED";
          return (
            <tr key={row.status} className="border-b last:border-0">
              <td className="py-2">
                <Link
                  href={`/campaigns?status=${row.status}`}
                  className={`hover:underline ${cancelled ? "text-gray-500" : ""}`}
                >
                  {formatEnum(row.status)}
                </Link>
              </td>
              <td className="py-2 text-right tabular-nums">{row.count}</td>
              <td className="w-1/2 py-2 pl-6" aria-hidden="true">
                <div
                  className={`h-2 rounded-full ${cancelled ? "bg-gray-100" : "bg-blue-100"}`}
                >
                  {row.feeCents > 0 && (
                    <div
                      className={`h-2 rounded-full ${cancelled ? "bg-gray-400" : "bg-blue-600"}`}
                      style={{ width: `${Math.max(width, 1)}%` }}
                    />
                  )}
                </div>
              </td>
              <td className="py-2 text-right tabular-nums">
                {formatMoney(row.feeCents, currency)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DueDate({ date, today }: { date: Date; today: Date }) {
  const late = date < today;
  const isToday = date.getTime() === today.getTime();
  return (
    <span
      className={`shrink-0 text-xs tabular-nums ${late ? "font-medium text-red-700" : "text-gray-600"}`}
    >
      {late ? "Late · " : isToday ? "Today · " : ""}
      {formatDate(date)}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded border border-dashed p-4 text-center text-sm text-gray-500">
      {children}
    </p>
  );
}
