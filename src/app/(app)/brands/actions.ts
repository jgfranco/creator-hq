"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentMembership, requireRole, ForbiddenError } from "@/lib/workspace";
import { brandSchema, type BrandInput } from "@/lib/validation/brand";
import { Prisma } from "@/generated/prisma/client";

export type BrandFormState = {
  message?: string;
  fieldErrors?: { name?: string[]; website?: string[]; notes?: string[] };
  values?: { name: string; website: string; notes: string };
};

type BrandWrite =
  | { ok: true; workspaceId: string; data: BrandInput }
  | { ok: false; state: BrandFormState };

// Steps shared by create and update: who is asking, are they allowed, is the input valid?
async function prepareBrandWrite(formData: FormData): Promise<BrandWrite> {
  const values = {
    name: String(formData.get("name") ?? ""),
    website: String(formData.get("website") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER", "MANAGER"]);
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, state: { message: error.message, values } };
    throw error;
  }

  const parsed = brandSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, state: { fieldErrors: z.flattenError(parsed.error).fieldErrors, values } };
  }

  return { ok: true, workspaceId: membership.workspaceId, data: parsed.data };
}

// Translate a unique-name violation into a field error; rethrow anything else.
async function duplicateNameState(
  error: unknown,
  workspaceId: string,
  name: string,
  formData: FormData,
): Promise<BrandFormState> {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
    throw error;
  }

  const existing = await prisma.brand.findFirst({
    where: { workspaceId, name },
    select: { archivedAt: true },
  });
  const message = existing?.archivedAt
    ? "An archived brand with this name exists. Unarchive it instead."
    : "A brand with this name already exists.";

  return {
    fieldErrors: { name: [message] },
    values: {
      name: String(formData.get("name") ?? ""),
      website: String(formData.get("website") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    },
  };
}

export async function createBrand(
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const write = await prepareBrandWrite(formData);
  if (!write.ok) return write.state;

  let id: string;
  try {
    ({ id } = await prisma.brand.create({
      data: { ...write.data, workspaceId: write.workspaceId },
      select: { id: true },
    }));
  } catch (error) {
    return duplicateNameState(error, write.workspaceId, write.data.name, formData);
  }

  revalidatePath("/brands");
  redirect(`/brands/${id}`);
}

export async function updateBrand(
  id: string,
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const write = await prepareBrandWrite(formData);
  if (!write.ok) return write.state;

  try {
    // updateMany so the workspace scope is part of the WHERE clause
    const { count } = await prisma.brand.updateMany({
      where: { id, workspaceId: write.workspaceId },
      data: write.data,
    });
    if (count === 0) notFound();
  } catch (error) {
    return duplicateNameState(error, write.workspaceId, write.data.name, formData);
  }

  revalidatePath("/brands");
  revalidatePath(`/brands/${id}`);
  redirect(`/brands/${id}`);
}

export async function setBrandArchived(id: string, archived: boolean) {
  const membership = await getCurrentMembership();
  requireRole(membership, ["OWNER", "MANAGER"]);

  const { count } = await prisma.brand.updateMany({
    where: { id, workspaceId: membership.workspaceId },
    data: { archivedAt: archived ? new Date() : null },
  });
  if (count === 0) notFound();

  revalidatePath("/brands");
  revalidatePath(`/brands/${id}`);
}
