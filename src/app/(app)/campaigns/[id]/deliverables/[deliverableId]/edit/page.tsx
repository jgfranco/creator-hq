import { Suspense } from "react";
import Link from "next/link";
import { getDeliverable } from "@/lib/deliverables";
import { getCurrentMembership } from "@/lib/workspace";
import { toDateInput } from "@/lib/dates";
import { DeliverableForm } from "../../deliverable-form";
import { updateDeliverable } from "../../actions";

type Props = PageProps<"/campaigns/[id]/deliverables/[deliverableId]/edit">;

export default function EditDeliverablePage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
      <EditDeliverable params={params} />
    </Suspense>
  );
}

async function EditDeliverable({ params }: { params: Props["params"] }) {
  const { id, deliverableId } = await params;
  const [deliverable, membership] = await Promise.all([
    getDeliverable(id, deliverableId),
    getCurrentMembership(),
  ]);
  const { campaign } = deliverable;

  return (
    <div>
      <Link
        href={`/campaigns/${campaign.id}`}
        className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-950"
      >
        ← {campaign.title}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Edit deliverable</h1>
      {membership.role === "VIEWER" ? (
        <p className="text-sm text-gray-600">
          You don&apos;t have permission to edit deliverables.
        </p>
      ) : (
        <DeliverableForm
          action={updateDeliverable.bind(null, campaign.id, deliverable.id)}
          defaultValues={{
            type: deliverable.type,
            platform: deliverable.platform,
            status: deliverable.status,
            dueDate: toDateInput(deliverable.dueDate),
            scheduledFor: toDateInput(deliverable.scheduledFor),
            postedAt: toDateInput(deliverable.postedAt),
            liveUrl: deliverable.liveUrl ?? "",
            revisionCount: String(deliverable.revisionCount),
            notes: deliverable.notes ?? "",
          }}
          submitLabel="Save changes"
          cancelHref={`/campaigns/${campaign.id}`}
        />
      )}
    </div>
  );
}
