import { prisma } from "./db";
import { uniqueSlug } from "./slug";

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

    return tx.membership.create({
      data: {
        role: "OWNER",
        user: { connect: { id: user.id } },
        workspace: {
          create: {
            name: `${user.name}'s Workspace`,
            slug: uniqueSlug(user.name),
          },
        },
      },
      include: { workspace: true },
    });
  });
}
