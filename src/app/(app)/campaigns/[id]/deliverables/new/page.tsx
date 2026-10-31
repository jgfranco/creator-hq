import { Suspense } from "react";
import Link from "next/link";
import { getCampaign } from "@/lib/campaigns";
import { getCurrentMembership } from "@/lib/workspace";
import { DeliverableForm } from "../deliverable-form";
import { createDeliverable } from "../actions";

export default function NewDeliverablePage({
  params,
}: PageProps<"/campaigns/[id]/deliverables/new">) {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
      <NewDeliverable params={params} />
    </Suspense>
  );
}

async function NewDeliverable({
  params,
}: {
  params: PageProps<"/campaigns/[id]/deliverables/new">["params"];
}) {
  const { id } = await params;
  const [campaign, membership] = await Promise.all([
    getCampaign(id),
    getCurrentMembership(),
  ]);

  return (
    <div>
      <Link
        href={`/campaigns/${campaign.id}`}
        className="mb-4 inline-block text-sm text-gray-600 hover:text-black"
      >
        ← {campaign.title}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">New deliverable</h1>
      {membership.role === "VIEWER" ? (
        <p className="text-sm text-gray-600">
          You don&apos;t have permission to add deliverables.
        </p>
      ) : (
        <DeliverableForm
          action={createDeliverable.bind(null, campaign.id)}
          submitLabel="Add deliverable"
          cancelHref={`/campaigns/${campaign.id}`}
        />
      )}
    </div>
  );
}
