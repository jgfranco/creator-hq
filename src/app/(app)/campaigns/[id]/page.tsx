import { Suspense } from "react";
import Link from "next/link";
import { getCampaign } from "@/lib/campaigns";
import { getCurrentMembership } from "@/lib/workspace";
import { formatEnum } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { CampaignStatus } from "@/generated/prisma/enums";
import { setCampaignStatus } from "../actions";
import { DeleteCampaignButton } from "./delete-button";

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
            <DeleteCampaignButton id={campaign.id} title={campaign.title} />
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
        <h2 className="mb-3 text-lg font-semibold">Deliverables</h2>
        {campaign.deliverables.length === 0 ? (
          <p className="text-sm text-gray-500">No deliverables yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Platform</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Due</th>
                <th className="py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {campaign.deliverables.map((deliverable) => (
                <tr key={deliverable.id} className="border-b last:border-0">
                  <td className="py-2">{formatEnum(deliverable.type)}</td>
                  <td className="py-2">{formatEnum(deliverable.platform)}</td>
                  <td className="py-2">{formatEnum(deliverable.status)}</td>
                  <td className="py-2">{formatDate(deliverable.dueDate)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
