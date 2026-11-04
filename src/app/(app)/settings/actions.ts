"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  clearCurrentWorkspace,
  ForbiddenError,
  getCurrentMembership,
  requireRole,
} from "@/lib/workspace";
import { isCurrencyLocked } from "@/lib/workspace-setup";
import {
  inviteSchema,
  roleSchema,
  workspaceSchema,
} from "@/lib/validation/workspace";
import {
  INVITE_TTL_DAYS,
  inviteLink,
  newInviteToken,
} from "@/lib/invite-token";
import type { Prisma, Role } from "@/generated/prisma/client";

export type WorkspaceFormState = {
  message?: string;
  saved?: boolean;
  fieldErrors?: { name?: string[]; currency?: string[] };
  values?: { name: string; currency: string };
};

export type InviteFormState = {
  message?: string;
  fieldErrors?: { email?: string[]; role?: string[] };
  values?: { email: string; role: string };
  // Shown once, right after the invite is created
  invite?: { email: string; link: string };
};

export type MemberActionResult = { error?: string } | void;

const LAST_OWNER_ERROR =
  "A workspace needs at least one owner. Make someone else an owner first.";

// Membership changes take this lock so two owners demoting each other at once
// can't both succeed and leave the workspace with none
async function withWorkspaceLock<T>(
  workspaceId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`;
    return fn(tx);
  });
}

function countOwners(tx: Prisma.TransactionClient, workspaceId: string) {
  return tx.membership.count({ where: { workspaceId, role: "OWNER" } });
}

async function requireOwner() {
  const membership = await getCurrentMembership();
  requireRole(membership, ["OWNER"]);
  return membership;
}

export async function updateWorkspace(
  _prevState: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  };

  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER"]);
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { message: error.message, values };
    throw error;
  }

  const parsed = workspaceSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { workspaceId } = membership;
  const locked = await withWorkspaceLock(workspaceId, async (tx) => {
    const { currency } = await tx.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { currency: true },
    });
    if (
      parsed.data.currency !== currency &&
      (await isCurrencyLocked(tx, workspaceId))
    ) {
      return true;
    }
    await tx.workspace.update({
      where: { id: workspaceId },
      data: parsed.data,
    });
    return false;
  });

  if (locked) {
    return {
      fieldErrors: {
        currency: [
          "The currency can't change once campaigns have fees or invoices exist.",
        ],
      },
      values,
    };
  }

  // The name shows in the header on every page
  revalidatePath("/", "layout");
  return { saved: true, values: parsed.data };
}

export async function inviteMember(
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const values = {
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };

  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER"]);
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { message: error.message, values };
    throw error;
  }

  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { email, role } = parsed.data;
  const { workspaceId } = membership;

  const alreadyMember = await prisma.membership.findFirst({
    where: {
      workspaceId,
      user: { email: { equals: email, mode: "insensitive" } },
    },
    select: { id: true },
  });
  if (alreadyMember) {
    return {
      fieldErrors: { email: ["This person is already a member."] },
      values,
    };
  }

  const { token, hash } = newInviteToken();
  await prisma.$transaction([
    // Re-inviting replaces the old link rather than leaving two valid ones
    prisma.invitation.deleteMany({
      where: { workspaceId, email, acceptedAt: null },
    }),
    prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role,
        tokenHash: hash,
        invitedById: membership.userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  revalidatePath("/settings/members");
  return {
    invite: { email, link: inviteLink(token) },
    values: { email: "", role },
  };
}

export async function revokeInvitation(
  id: string,
): Promise<MemberActionResult> {
  const { workspaceId } = await requireOwner();

  const { count } = await prisma.invitation.deleteMany({
    where: { id, workspaceId, acceptedAt: null },
  });
  if (count === 0) notFound();

  revalidatePath("/settings/members");
}

export async function changeRole(
  membershipId: string,
  _prevState: MemberActionResult,
  formData: FormData,
): Promise<MemberActionResult> {
  const { workspaceId } = await requireOwner();

  const parsed = roleSchema.safeParse(formData.get("role"));
  if (!parsed.success) return { error: "Choose a role." };
  const role: Role = parsed.data;

  const error = await withWorkspaceLock(workspaceId, async (tx) => {
    const target = await tx.membership.findFirst({
      where: { id: membershipId, workspaceId },
      select: { role: true },
    });
    if (!target) return "not-found";
    if (
      target.role === "OWNER" &&
      role !== "OWNER" &&
      (await countOwners(tx, workspaceId)) === 1
    ) {
      return LAST_OWNER_ERROR;
    }
    await tx.membership.update({ where: { id: membershipId }, data: { role } });
    return null;
  });
  if (error === "not-found") notFound();
  if (error) return { error };

  revalidatePath("/", "layout");
}

export async function removeMember(
  membershipId: string,
): Promise<MemberActionResult> {
  const membership = await requireOwner();
  const { workspaceId } = membership;
  if (membershipId === membership.id) {
    return { error: "To remove yourself, use Leave workspace." };
  }

  const error = await withWorkspaceLock(workspaceId, async (tx) => {
    const target = await tx.membership.findFirst({
      where: { id: membershipId, workspaceId },
      select: { role: true },
    });
    if (!target) return "not-found";
    if (target.role === "OWNER" && (await countOwners(tx, workspaceId)) === 1) {
      return LAST_OWNER_ERROR;
    }
    await tx.membership.delete({ where: { id: membershipId } });
    return null;
  });
  if (error === "not-found") notFound();
  if (error) return { error };

  revalidatePath("/settings/members");
}

export async function leaveWorkspace(): Promise<MemberActionResult> {
  const membership = await getCurrentMembership();
  const { workspaceId } = membership;

  const error = await withWorkspaceLock(workspaceId, async (tx) => {
    // Re-read inside the lock: the role may have changed since the request began
    const current = await tx.membership.findUnique({
      where: { id: membership.id },
      select: { role: true },
    });
    if (!current) return null; // already gone
    if (
      (await tx.membership.count({ where: { userId: membership.userId } })) ===
      1
    ) {
      return "You can't leave your only workspace.";
    }
    if (
      current.role === "OWNER" &&
      (await countOwners(tx, workspaceId)) === 1
    ) {
      return "You're the only owner. Make someone else an owner before leaving.";
    }
    await tx.membership.delete({ where: { id: membership.id } });
    return null;
  });
  if (error) return { error };

  await clearCurrentWorkspace();
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
