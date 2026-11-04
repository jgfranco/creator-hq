import { prisma } from "./db";
import { uniqueSlug } from "./slug";
import type { Prisma } from "@/generated/prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

// A new workspace with the given user as its OWNER
export function createWorkspace(
  tx: Prisma.TransactionClient,
  {
    userId,
    name,
    currency,
  }: { userId: string; name: string; currency?: string },
) {
  return tx.membership.create({
    data: {
      role: "OWNER",
      user: { connect: { id: userId } },
      workspace: { create: { name, slug: uniqueSlug(name), currency } },
    },
    include: { workspace: true },
  });
}

// Idempotent: a per-user advisory lock serializes concurrent callers (sign-up hook,
// self-heal on parallel requests), and the re-check inside the lock means only the
// first one creates a workspace.
export function ensurePersonalWorkspace(user: { id: string; name: string }) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}::text))`;

    const existing = await tx.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { workspace: true },
    });
    if (existing) return existing;

    return createWorkspace(tx, {
      userId: user.id,
      name: `${user.name}'s Workspace`,
    });
  });
}

// Campaign fees are stored in the workspace currency without a currency of their
// own, so once any exist (or any invoice does) changing it would reprice them.
export async function isCurrencyLocked(db: Db, workspaceId: string) {
  const [fees, invoices] = await Promise.all([
    db.campaign.count({ where: { workspaceId, feeCents: { not: null } } }),
    db.invoice.count({ where: { workspaceId } }),
  ]);
  return fees > 0 || invoices > 0;
}
