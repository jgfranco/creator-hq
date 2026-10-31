import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";

// Deliverables have no workspaceId of their own; scope through the parent campaign.
export async function getDeliverable(campaignId: string, id: string) {
  const { workspaceId } = await getCurrentMembership();

  const deliverable = await prisma.deliverable.findFirst({
    where: { id, campaignId, campaign: { workspaceId } },
    select: {
      id: true,
      type: true,
      platform: true,
      status: true,
      dueDate: true,
      scheduledFor: true,
      postedAt: true,
      liveUrl: true,
      revisionCount: true,
      notes: true,
      campaign: { select: { id: true, title: true } },
    },
  });

  if (!deliverable) notFound();
  return deliverable;
}
