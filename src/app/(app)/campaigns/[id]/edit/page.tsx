import { Suspense } from "react";
import { getCampaign } from "@/lib/campaigns";
import { listBrandOptions } from "@/lib/brands";
import { getCurrentMembership } from "@/lib/workspace";
import { toMoneyInput } from "@/lib/money";
import { toDateInput } from "@/lib/dates";
import { CampaignForm } from "../../campaign-form";
import { updateCampaign } from "../../actions";

export default function EditCampaignPage({
  params,
}: PageProps<"/campaigns/[id]/edit">) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Edit campaign</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <EditCampaignForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditCampaignForm({
  params,
}: {
  params: PageProps<"/campaigns/[id]/edit">["params"];
}) {
  const { id } = await params;
  const [campaign, membership] = await Promise.all([
    getCampaign(id),
    getCurrentMembership(),
  ]);

  if (membership.role === "VIEWER") {
    return (
      <p className="text-sm text-gray-600">
        You don&apos;t have permission to edit campaigns.
      </p>
    );
  }

  const brands = await listBrandOptions({ includeId: campaign.brand.id });
  const { currency } = membership.workspace;

  return (
    <CampaignForm
      action={updateCampaign.bind(null, campaign.id)}
      brands={brands}
      currency={currency}
      defaultValues={{
        title: campaign.title,
        brandId: campaign.brand.id,
        status: campaign.status,
        fee: toMoneyInput(campaign.feeCents, currency),
        startDate: toDateInput(campaign.startDate),
        endDate: toDateInput(campaign.endDate),
      }}
      submitLabel="Save changes"
      cancelHref={`/campaigns/${campaign.id}`}
    />
  );
}
