import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";
import { likeEscape } from "./search";

export async function listBrands({
  archived = false,
  q,
}: { archived?: boolean; q?: string } = {}) {
  const { workspaceId } = await getCurrentMembership();

  return prisma.brand.findMany({
    where: {
      workspaceId,
      archivedAt: archived ? { not: null } : null,
      // Name, or any contact's name or email
      ...(q && {
        OR: [
          { name: { contains: likeEscape(q), mode: "insensitive" } },
          {
            contacts: {
              some: {
                OR: [
                  { name: { contains: likeEscape(q), mode: "insensitive" } },
                  { email: { contains: likeEscape(q), mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      }),
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

// Brands a campaign can be assigned to: active ones, plus the campaign's current
// brand when editing (so an archived brand doesn't silently drop out of the select).
export async function listBrandOptions({ includeId }: { includeId?: string } = {}) {
  const { workspaceId } = await getCurrentMembership();

  return prisma.brand.findMany({
    where: {
      workspaceId,
      OR: [{ archivedAt: null }, ...(includeId ? [{ id: includeId }] : [])],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
