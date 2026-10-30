import "server-only";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";

export async function listBrands({ archived = false }: { archived?: boolean } = {}) {
  const { workspaceId } = await getCurrentMembership();

  return prisma.brand.findMany({
    where: {
      workspaceId,
      archivedAt: archived ? { not: null } : null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      website: true,
      contacts: {
        where: { isPrimary: true },
        select: { name: true, email: true },
        take: 1,
      },
      _count: { select: { campaigns: true } },
    },
  });
}