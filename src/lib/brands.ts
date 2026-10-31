import "server-only";
import { notFound } from "next/navigation";
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

export async function getBrand(id: string) {
  const { workspaceId } = await getCurrentMembership();

  const brand = await prisma.brand.findFirst({
    where: { id, workspaceId },
    select: {
      id: true,
      name: true,
      website: true,
      notes: true,
      archivedAt: true,
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        select: { id: true, name: true, email: true, title: true, isPrimary: true },
      },
      campaigns: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, feeCents: true },
      },
    },
  });

  if (!brand) notFound();
  return brand;
}
