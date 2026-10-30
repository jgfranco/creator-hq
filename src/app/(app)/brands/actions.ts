"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentMembership, requireRole, ForbiddenError } from "@/lib/workspace";
import { brandSchema } from "@/lib/validation/brand";
import { Prisma } from "@/generated/prisma/client";

export type BrandFormState = {
  message?: string;
  fieldErrors?: { name?: string[]; website?: string[]; notes?: string[] };
  values?: { name: string; website: string; notes: string };
};

export async function createBrand(
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    website: String(formData.get("website") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  // 1–2. Who is asking, and are they allowed?
  const membership = await getCurrentMembership();
  try {
    requireRole(membership, ["OWNER", "MANAGER"]);
  } catch (error) {
    if (error instanceof ForbiddenError) return { message: error.message, values };
    throw error;
  }

  // 3. Validate
  const parsed = brandSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  // 4–5. Create, scoped to the caller's workspace
  try {
    await prisma.brand.create({
      data: { ...parsed.data, workspaceId: membership.workspaceId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { name: ["A brand with this name already exists."] }, values };
    }
    throw error;
  }

  // 6. Success
  revalidatePath("/brands");
  redirect("/brands");
}