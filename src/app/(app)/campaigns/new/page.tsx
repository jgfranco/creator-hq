import { Suspense } from "react";
import { listBrandOptions } from "@/lib/brands";
import { getCurrentMembership } from "@/lib/workspace";
import { CampaignForm } from "../campaign-form";
import { createCampaign } from "../actions";

export default function NewCampaignPage({ searchParams }: PageProps<"/campaigns/new">) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">New campaign</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <NewCampaignForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewCampaignForm({
  searchParams,
}: {
  searchParams: PageProps<"/campaigns/new">["searchParams"];
}) {
  const [{ brandId }, brands, membership] = await Promise.all([
    searchParams,
    listBrandOptions(),
    getCurrentMembership(),
  ]);

  if (membership.role === "VIEWER") {
    return <p className="text-sm text-gray-600">You don&apos;t have permission to create campaigns.</p>;
  }

  // ?brandId= preselects the brand when coming from a brand's page
  const preselected = brands.find((brand) => brand.id === brandId)?.id ?? "";

  return (
    <CampaignForm
      action={createCampaign}
      brands={brands}
      currency={membership.workspace.currency}
      defaultValues={{ title: "", brandId: preselected, status: "LEAD", fee: "", startDate: "", endDate: "" }}
      submitLabel="Create campaign"
      cancelHref="/campaigns"
    />
  );
}
