"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, setCurrentWorkspace } from "@/lib/workspace";
import { hashInviteToken } from "@/lib/invite-token";

export async function acceptInvitation(
  token: string,
): Promise<{ error?: string } | void> {
  const session = await requireSession();
  const tokenHash = hashInviteToken(token);

  const outcome = await prisma.$transaction(
    async (tx): Promise<{ error: string } | { workspaceId: string }> => {
      // Lock the invite so two tabs accepting at once can't both use it
      await tx.$queryRaw`SELECT id FROM "Invitation" WHERE "tokenHash" = ${tokenHash} FOR UPDATE`;
      const invite = await tx.invitation.findUnique({ where: { tokenHash } });

      if (!invite) return { error: "This invite is no longer valid." };
      if (invite.acceptedAt)
        return { error: "This invite has already been used." };
      if (invite.expiresAt < new Date()) {
        return { error: "This invite has expired. Ask for a new one." };
      }
      if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
        return { error: "This invite is for a different email address." };
      }

      const existing = await tx.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: session.user.id,
            workspaceId: invite.workspaceId,
          },
        },
        select: { id: true },
      });
      if (!existing) {
        await tx.membership.create({
          data: {
            userId: session.user.id,
            workspaceId: invite.workspaceId,
            role: invite.role,
          },
        });
      }
      await tx.invitation.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return { workspaceId: invite.workspaceId };
    },
  );

  if ("error" in outcome) return outcome;

  await setCurrentWorkspace(outcome.workspaceId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
