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
import {
  deliverableSchema,
  type DeliverableInput,
} from "@/lib/validation/deliverable";
import { today } from "@/lib/dates";
import { DeliverableStatus } from "@/generated/prisma/enums";

const FIELDS = [
  "type",
  "platform",
  "status",
  "dueDate",
  "scheduledFor",
  "postedAt",
  "liveUrl",
  "revisionCount",
  "notes",
] as const;
type Field = (typeof FIELDS)[number];

export type DeliverableFormState = {
  message?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  values?: Record<Field, string>;
};

type DeliverableWrite =
  | { ok: true; workspaceId: string; data: DeliverableInput }
  | { ok: false; state: DeliverableFormState };

// Shared by create and update: who is asking, are they allowed, is the input valid?
async function prepareDeliverableWrite(
  formData: FormData,
): Promise<DeliverableWrite> {
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

  const parsed = deliverableSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      state: { fieldErrors: z.flattenError(parsed.error).fieldErrors, values },
    };
  }

  return {
    ok: true,
    workspaceId: membership.workspaceId,
    data: withPostedAt(parsed.data),
  };
}

// Marking something posted without a date most likely means "posted today"
function withPostedAt<
  T extends { status: DeliverableStatus; postedAt: Date | null },
>(data: T): T {
  return data.status === "POSTED" && !data.postedAt
    ? { ...data, postedAt: today() }
    : data;
}

function revalidateCampaign(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}

export async function createDeliverable(
  campaignId: string,
  _prevState: DeliverableFormState,
  formData: FormData,
): Promise<DeliverableFormState> {
  const write = await prepareDeliverableWrite(formData);
  if (!write.ok) return write.state;

  // campaignId comes from the URL, so confirm it belongs to the caller's workspace
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId: write.workspaceId },
    select: { id: true },
  });
  if (!campaign) notFound();

  await prisma.deliverable.create({ data: { ...write.data, campaignId } });

  revalidateCampaign(campaignId);
  redirect(`/campaigns/${campaignId}`);
}

export async function updateDeliverable(
  campaignId: string,
  id: string,
  _prevState: DeliverableFormState,
  formData: FormData,
): Promise<DeliverableFormState> {
  const write = await prepareDeliverableWrite(formData);
  if (!write.ok) return write.state;

  // updateMany so the workspace scope (via the campaign) is part of the WHERE clause
  const { count } = await prisma.deliverable.updateMany({
    where: { id, campaignId, campaign: { workspaceId: write.workspaceId } },
    data: write.data,
  });
  if (count === 0) notFound();

  revalidateCampaign(campaignId);
  redirect(`/campaigns/${campaignId}`);
}

export async function setDeliverableStatus(
  campaignId: string,
  id: string,
  formData: FormData,
) {
  const membership = await getCurrentMembership();
  requireRole(membership, ["OWNER", "MANAGER"]);

  const status = z.enum(DeliverableStatus).parse(formData.get("status"));
  const where = {
    id,
    campaignId,
    campaign: { workspaceId: membership.workspaceId },
  };

  const current = await prisma.deliverable.findFirst({
    where,
    select: { postedAt: true },
  });
  if (!current) notFound();

  await prisma.deliverable.updateMany({
    where,
    data: withPostedAt({ status, postedAt: current.postedAt }),
  });

  revalidateCampaign(campaignId);
}

export async function deleteDeliverable(campaignId: string, id: string) {
  const membership = await getCurrentMembership();
  requireRole(membership, ["OWNER", "MANAGER"]);

  const { count } = await prisma.deliverable.deleteMany({
    where: {
      id,
      campaignId,
      campaign: { workspaceId: membership.workspaceId },
    },
  });
  if (count === 0) notFound();

  revalidateCampaign(campaignId);
}
