import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";
import type { CampaignStatus } from "@/generated/prisma/enums";

export async function listCampaigns({
  status,
}: { status?: CampaignStatus } = {}) {
  const { workspaceId } = await getCurrentMembership();

  return prisma.campaign.findMany({
    where: { workspaceId, status },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      feeCents: true,
      startDate: true,
      endDate: true,
      brand: { select: { id: true, name: true } },
      _count: { select: { deliverables: true } },
    },
  });
}

export async function getCampaign(id: string) {
  const { workspaceId } = await getCurrentMembership();

  const campaign = await prisma.campaign.findFirst({
    where: { id, workspaceId },
    select: {
      id: true,
      title: true,
      status: true,
      feeCents: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      brand: { select: { id: true, name: true, archivedAt: true } },
      deliverables: {
        orderBy: [
          { dueDate: { sort: "asc", nulls: "last" } },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          type: true,
          platform: true,
          status: true,
          dueDate: true,
          liveUrl: true,
        },
      },
    },
  });

  if (!campaign) notFound();
  return campaign;
}
