import { Suspense } from "react";
import Link from "next/link";
import { FilterTab } from "../filter-tab";
import { listCampaigns } from "@/lib/campaigns";
import { getCurrentMembership } from "@/lib/workspace";
import { formatEnum } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { CampaignStatus } from "@/generated/prisma/enums";

export default function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <Link href="/campaigns/new" className="rounded bg-black px-3 py-2 text-sm text-white">
          New campaign
        </Link>
      </div>

      <Suspense fallback={<p className="text-sm text-gray-500">Loading campaigns…</p>}>
        <CampaignsView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CampaignsView({
  searchParams,
}: {
  searchParams: PageProps<"/campaigns">["searchParams"];
}) {
  const { status: statusParam } = await searchParams;
  // Ignore unknown values rather than erroring on a hand-edited URL
  const status = Object.values(CampaignStatus).find((s) => s === statusParam);

  const [campaigns, membership] = await Promise.all([
    listCampaigns({ status }),
    getCurrentMembership(),
  ]);
  const { currency } = membership.workspace;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1 text-sm">
        <FilterTab href="/campaigns" active={!status}>
          All
        </FilterTab>
        {Object.values(CampaignStatus).map((s) => (
          <FilterTab key={s} href={`/campaigns?status=${s}`} active={status === s}>
            {formatEnum(s)}
          </FilterTab>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
          {status
            ? `No ${formatEnum(status).toLowerCase()} campaigns.`
            : "No campaigns yet. Create one to start tracking a brand deal."}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2 font-medium">Campaign</th>
              <th className="py-2 font-medium">Brand</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Dates</th>
              <th className="py-2 text-right font-medium">Deliverables</th>
              <th className="py-2 text-right font-medium">Fee</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b last:border-0">
                <td className="py-2 font-medium">
                  <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                    {campaign.title}
                  </Link>
                </td>
                <td className="py-2">
                  <Link href={`/brands/${campaign.brand.id}`} className="hover:underline">
                    {campaign.brand.name}
                  </Link>
                </td>
                <td className="py-2">{formatEnum(campaign.status)}</td>
                <td className="py-2 text-gray-600">
                  {campaign.startDate || campaign.endDate
                    ? `${formatDate(campaign.startDate)} – ${formatDate(campaign.endDate)}`
                    : "—"}
                </td>
                <td className="py-2 text-right tabular-nums">{campaign._count.deliverables}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(campaign.feeCents, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
