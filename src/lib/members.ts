import "server-only";
import { prisma } from "./db";
import { getCurrentMembership } from "./workspace";
import { hashInviteToken } from "./invite-token";

export async function listMembers() {
  const { workspaceId } = await getCurrentMembership();

  return prisma.membership.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

// Not yet accepted, including expired ones so they can be revoked or re-sent
export async function listPendingInvitations() {
  const { workspaceId } = await getCurrentMembership();

  return prisma.invitation.findMany({
    where: { workspaceId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      invitedBy: { select: { name: true } },
    },
  });
}

// Not scoped to a workspace: holding the token is what grants access
export async function getInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { name: true } },
    },
  });
}
