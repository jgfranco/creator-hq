import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./db";
import { createPersonalWorkspace } from "./workspace-setup";
import type { Role } from "@/generated/prisma/client";
import { connection } from "next/server";

export const requireSession = cache(async () => {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }
  return session;
});
export const getCurrentMembership = cache(async () => {
  const session = await requireSession();

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { workspace: true },
  });

  if (membership) {
    return membership;
  }

  // Self-heal: the sign-up hook failed or was skipped, so create the workspace now
  console.warn(
    `[workspace] User ${session.user.id} had no workspace; creating one.`,
  );
  return createPersonalWorkspace(session.user);
});

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireRole(membership: { role: Role }, allowedRoles: Role[]) {
  if (!allowedRoles.includes(membership.role)) {
    throw new ForbiddenError();
  }
}
