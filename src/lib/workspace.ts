import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./db";
import { ensurePersonalWorkspace } from "./workspace-setup";
import type { Role } from "@/generated/prisma/client";
import { connection } from "next/server";

// Holds the id of the workspace the user last switched to
const WORKSPACE_COOKIE = "workspace";

export const getSession = cache(async () => {
  await connection();
  return auth.api.getSession({ headers: await headers() });
});

export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
});

export const getCurrentMembership = cache(async () => {
  const session = await requireSession();

  // The cookie is only a preference: it counts only if the user is a member there,
  // so a stale or forged value falls through to their oldest workspace
  const preferred = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  if (preferred) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId: session.user.id, workspaceId: preferred },
      },
      include: { workspace: true },
    });
    if (membership) return membership;
  }

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
  return ensurePersonalWorkspace(session.user);
});

// For the header switcher
export async function listMyWorkspaces() {
  const session = await requireSession();
  return prisma.membership.findMany({
    where: { userId: session.user.id },
    orderBy: { workspace: { name: "asc" } },
    select: { role: true, workspace: { select: { id: true, name: true } } },
  });
}

// Server actions only (cookies can't be set while rendering)
export async function setCurrentWorkspace(workspaceId: string) {
  (await cookies()).set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    // Like Better Auth's own cookies: secure whenever the site is served over https
    secure: process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearCurrentWorkspace() {
  (await cookies()).delete(WORKSPACE_COOKIE);
}

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
