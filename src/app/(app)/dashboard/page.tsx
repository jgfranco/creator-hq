import { Suspense } from "react";
import { getCurrentMembership } from "@/lib/workspace";
import { listCampaigns } from "@/lib/campaigns";
import { formatMoney } from "@/lib/money";
import { formatEnum } from "@/lib/format";

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <WorkspaceHeader />
      </Suspense>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Campaigns</h2>
        <Suspense
          fallback={<p className="text-sm text-gray-500">Loading campaigns…</p>}
        >
          <CampaignsTable />
        </Suspense>
      </section>
    </div>
  );
}

async function WorkspaceHeader() {
  const membership = await getCurrentMembership();

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{membership.workspace.name}</h1>
        <p className="text-sm text-gray-500">
          Your role: {formatEnum(membership.role)}
        </p>
      </div>

    </header>
  );
}

async function CampaignsTable() {
  const [membership, campaigns] = await Promise.all([
    getCurrentMembership(),
    listCampaigns(),
  ]);
  const { currency } = membership.workspace;

  if (campaigns.length === 0) {
    return (
      <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
        No campaigns yet. Your brand deals will show up here.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b text-gray-500">
        <tr>
          <th className="py-2 font-medium">Campaign</th>
          <th className="py-2 font-medium">Brand</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">Deliverables</th>
          <th className="py-2 text-right font-medium">Fee</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map((campaign) => (
          <tr key={campaign.id} className="border-b last:border-0">
            <td className="py-2">{campaign.title}</td>
            <td className="py-2">{campaign.brand.name}</td>
            <td className="py-2">{formatEnum(campaign.status)}</td>
            <td className="py-2">{campaign._count.deliverables}</td>
            <td className="py-2 text-right tabular-nums">
              {formatMoney(campaign.feeCents, currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
