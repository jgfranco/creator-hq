"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  getCurrentMembership,
  requireRole,
  ForbiddenError,
} from "@/lib/workspace";
import { campaignSchema, type CampaignInput } from "@/lib/validation/campaign";
import { CampaignStatus } from "@/generated/prisma/enums";

const FIELDS = [
  "title",
  "brandId",
  "status",
  "fee",
  "startDate",
  "endDate",
] as const;
type Field = (typeof FIELDS)[number];

export type CampaignFormState = {
  message?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  values?: Record<Field, string>;
};

type CampaignWrite =
  | { ok: true; workspaceId: string; data: CampaignInput }
  | { ok: false; state: CampaignFormState };

// Shared by create and update: who is asking, are they allowed, is the input valid,
// and does the brand belong to this workspace?
async function prepareCampaignWrite(
  formData: FormData,
  { currentBrandId }: { currentBrandId?: string } = {},
): Promise<CampaignWrite> {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<Field, string>;

  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER", "MANAGER"]);
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { ok: false, state: { message: error.message, values } };
    throw error;
  }

  const parsed = campaignSchema(membership.workspace.currency).safeParse(
    values,
  );
  if (!parsed.success) {
    return {
      ok: false,
      state: { fieldErrors: z.flattenError(parsed.error).fieldErrors, values },
    };
  }

  // The brandId comes from the client, so it must be checked against the caller's workspace.
  // Archived brands can't take new campaigns, but a campaign may keep the one it already has.
  const brand = await prisma.brand.findFirst({
    where: { id: parsed.data.brandId, workspaceId: membership.workspaceId },
    select: { id: true, archivedAt: true },
  });
  if (!brand || (brand.archivedAt && brand.id !== currentBrandId)) {
    return {
      ok: false,
      state: { fieldErrors: { brandId: ["Choose an active brand"] }, values },
    };
  }

  return { ok: true, workspaceId: membership.workspaceId, data: parsed.data };
}

export async function createCampaign(
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const write = await prepareCampaignWrite(formData);
  if (!write.ok) return write.state;

  const { id } = await prisma.campaign.create({
    data: { ...write.data, workspaceId: write.workspaceId },
    select: { id: true },
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  redirect(`/campaigns/${id}`);
}

export async function updateCampaign(
  id: string,
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const { workspaceId } = await getCurrentMembership();
  const existing = await prisma.campaign.findFirst({
    where: { id, workspaceId },
    select: { brandId: true },
  });
  if (!existing) notFound();

  const write = await prepareCampaignWrite(formData, {
    currentBrandId: existing.brandId,
  });
  if (!write.ok) return write.state;

  // updateMany so the workspace scope is part of the WHERE clause
  const { count } = await prisma.campaign.updateMany({
    where: { id, workspaceId: write.workspaceId },
    data: write.data,
  });
  if (count === 0) notFound();

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/dashboard");
  redirect(`/campaigns/${id}`);
}

export async function setCampaignStatus(id: string, formData: FormData) {
  const membership = await getCurrentMembership();
  requireRole(membership, ["OWNER", "MANAGER"]);

  const status = z.enum(CampaignStatus).parse(formData.get("status"));
  const { count } = await prisma.campaign.updateMany({
    where: { id, workspaceId: membership.workspaceId },
    data: { status },
  });
  if (count === 0) notFound();

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteCampaign(
  id: string,
): Promise<{ error?: string } | void> {
  const membership = await getCurrentMembership();
  requireRole(membership, ["OWNER", "MANAGER"]);

  // Invoices are financial records, so a campaign that has any can't be deleted.
  // The foreign key enforces this too; checking first gives a readable message.
  const invoiceCount = await prisma.invoice.count({
    where: { campaignId: id, workspaceId: membership.workspaceId },
  });
  if (invoiceCount > 0) {
    return {
      error:
        "This campaign has invoices, so it can't be deleted. Cancel it instead.",
    };
  }

  // Deliverables are removed by the cascade on Deliverable.campaignId
  const { count } = await prisma.campaign.deleteMany({
    where: { id, workspaceId: membership.workspaceId },
  });
  if (count === 0) notFound();

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  redirect("/campaigns");
}
