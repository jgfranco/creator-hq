import "server-only";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";

export async function listCampaigns() {
  const { workspaceId } = await getCurrentMembership();

  return prisma.campaign.findMany({
    where: { workspaceId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      feeCents: true,
      brand: { select: { name: true } },
      _count: { select: { deliverables: true } },
    },
  });
}