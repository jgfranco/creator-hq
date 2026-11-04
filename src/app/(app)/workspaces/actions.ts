"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, setCurrentWorkspace } from "@/lib/workspace";
import { createWorkspace as createWorkspaceFor } from "@/lib/workspace-setup";
import { workspaceSchema } from "@/lib/validation/workspace";
import type { WorkspaceFormState } from "../settings/actions";

export async function createWorkspace(
  _prevState: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  };

  const session = await requireSession();
  const parsed = workspaceSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { workspaceId } = await prisma.$transaction((tx) =>
    createWorkspaceFor(tx, { userId: session.user.id, ...parsed.data }),
  );

  await setCurrentWorkspace(workspaceId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function switchWorkspace(workspaceId: string) {
  const session = await requireSession();

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
    select: { id: true },
  });
  // Not a member: ignore the request and stay in the current workspace
  if (membership) {
    await setCurrentWorkspace(workspaceId);
    revalidatePath("/", "layout");
  }

  // Detail pages belong to the old workspace, so start from the dashboard
  redirect("/dashboard");
}
