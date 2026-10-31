import { Suspense } from "react";
import Link from "next/link";
import { getCampaign } from "@/lib/campaigns";
import { getCurrentMembership } from "@/lib/workspace";
import { formatEnum, formatPlatform } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { CampaignStatus, DeliverableStatus } from "@/generated/prisma/enums";
import { deleteCampaign, setCampaignStatus } from "../actions";
import { DeleteButton } from "../../action-button";
import { sumPayments } from "@/lib/invoices";
import { formatInvoiceNumber } from "@/lib/invoice-rules";
import { InvoiceStatusBadge } from "../../invoices/status-badge";
import {
  deleteDeliverable,
  setDeliverableStatus,
} from "./deliverables/actions";

export default function CampaignPage({ params }: PageProps<"/campaigns/[id]">) {
  return (
    <div>
      <Link
        href="/campaigns"
        className="mb-4 inline-block text-sm text-gray-600 hover:text-black"
      >
        ← Campaigns
      </Link>
      <Suspense
        fallback={<p className="text-sm text-gray-500">Loading campaign…</p>}
      >
        <CampaignView params={params} />
      </Suspense>
    </div>
  );
}

async function CampaignView({
  params,
}: {
  params: PageProps<"/campaigns/[id]">["params"];
}) {
  const { id } = await params;
  const [campaign, membership] = await Promise.all([
    getCampaign(id),
    getCurrentMembership(),
  ]);
  const canEdit = membership.role !== "VIEWER";

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.title}</h1>
          <Link
            href={`/brands/${campaign.brand.id}`}
            className="text-sm underline"
          >
            {campaign.brand.name}
          </Link>
          {campaign.brand.archivedAt && (
            <span className="ml-2 text-xs text-gray-500">(archived brand)</span>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Link
              href={`/campaigns/${campaign.id}/edit`}
              className="rounded border px-3 py-2 text-sm"
            >
              Edit
            </Link>
            <DeleteButton
              action={deleteCampaign.bind(null, campaign.id)}
              confirmMessage={`Delete "${campaign.title}" and all its deliverables? This can't be undone.`}
            />
          </div>
        )}
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">Status</dt>
          <dd className="mt-1">
            {canEdit ? (
              // key remounts the select so it shows the saved status after revalidation
              <form
                key={campaign.status}
                action={setCampaignStatus.bind(null, campaign.id)}
                className="flex gap-2"
              >
                <select
                  name="status"
                  defaultValue={campaign.status}
                  aria-label="Status"
                  className="rounded border px-2 py-1"
                >
                  {Object.values(CampaignStatus).map((status) => (
                    <option key={status} value={status}>
                      {formatEnum(status)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded border px-2 py-1">
                  Update
                </button>
              </form>
            ) : (
              formatEnum(campaign.status)
            )}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Fee</dt>
          <dd className="mt-1 tabular-nums">
            {formatMoney(campaign.feeCents, membership.workspace.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Start</dt>
          <dd className="mt-1">{formatDate(campaign.startDate)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">End</dt>
          <dd className="mt-1">{formatDate(campaign.endDate)}</dd>
        </div>
      </dl>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Deliverables</h2>
          {canEdit && (
            <Link
              href={`/campaigns/${campaign.id}/deliverables/new`}
              className="text-sm underline"
            >
              Add deliverable
            </Link>
          )}
        </div>
        {campaign.deliverables.length === 0 ? (
          <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
            No deliverables yet. Add the posts, videos and other content this
            deal requires.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-2 font-medium">Deliverable</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Due</th>
                <th className="py-2 text-right font-medium">Revisions</th>
                <th className="py-2 font-medium">Link</th>
                {canEdit && <th className="py-2" aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {campaign.deliverables.map((deliverable) => {
                const label = `${formatPlatform(deliverable.platform)} ${formatEnum(deliverable.type).toLowerCase()}`;
                return (
                  <tr key={deliverable.id} className="border-b last:border-0">
                    <td className="py-2">{label}</td>
                    <td className="py-2">
                      {canEdit ? (
                        <form
                          key={deliverable.status}
                          action={setDeliverableStatus.bind(
                            null,
                            campaign.id,
                            deliverable.id,
                          )}
                          className="flex gap-1"
                        >
                          <select
                            name="status"
                            defaultValue={deliverable.status}
                            aria-label={`Status of ${label}`}
                            className="rounded border px-1 py-0.5 text-xs"
                          >
                            {Object.values(DeliverableStatus).map((status) => (
                              <option key={status} value={status}>
                                {formatEnum(status)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded border px-1.5 py-0.5 text-xs"
                          >
                            Update
                          </button>
                        </form>
                      ) : (
                        formatEnum(deliverable.status)
                      )}
                    </td>
                    <td className="py-2">{formatDate(deliverable.dueDate)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {deliverable.revisionCount}
                    </td>
                    <td className="py-2">
                      {deliverable.liveUrl ? (
                        <a
                          href={deliverable.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-2">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/campaigns/${campaign.id}/deliverables/${deliverable.id}/edit`}
                            className="rounded border px-2 py-1 text-xs"
                          >
                            Edit
                          </Link>
                          <DeleteButton
                            action={deleteDeliverable.bind(
                              null,
                              campaign.id,
                              deliverable.id,
                            )}
                            confirmMessage={`Delete this ${label}? This can't be undone.`}
                            size="sm"
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Invoices</h2>
          {canEdit && campaign.status !== "CANCELLED" && (
            <Link
              href={`/invoices/new?campaignId=${campaign.id}`}
              className="text-sm underline"
            >
              New invoice
            </Link>
          )}
        </div>
        {campaign.invoices.length === 0 ? (
          <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
            No invoices yet. Bill the brand once the work is agreed or
            delivered.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-2 font-medium">Invoice</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Due</th>
                <th className="py-2 text-right font-medium">Total</th>
                <th className="py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {campaign.invoices.map((invoice) => {
                const owed =
                  invoice.status === "SENT" ||
                  invoice.status === "PARTIALLY_PAID";
                const balance =
                  invoice.totalCents - sumPayments(invoice.payments);
                return (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="hover:underline"
                      >
                        {formatInvoiceNumber(invoice.number)}
                      </Link>
                    </td>
                    <td className="py-2">
                      <InvoiceStatusBadge
                        status={invoice.status}
                        dueDate={invoice.dueDate}
                      />
                    </td>
                    <td className="py-2">{formatDate(invoice.dueDate)}</td>
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
      </section>
    </>
  );
}
