import { Suspense } from "react";
import { getBrand } from "@/lib/brands";
import { getCurrentMembership } from "@/lib/workspace";
import { BrandForm } from "../../brand-form";
import { updateBrand } from "../../actions";

export default function EditBrandPage({
  params,
}: PageProps<"/brands/[id]/edit">) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Edit brand</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <EditBrandForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditBrandForm({
  params,
}: {
  params: PageProps<"/brands/[id]/edit">["params"];
}) {
  const { id } = await params;
  const [brand, membership] = await Promise.all([
    getBrand(id),
    getCurrentMembership(),
  ]);

  if (membership.role === "VIEWER") {
    return (
      <p className="text-sm text-gray-600">
        You don&apos;t have permission to edit brands.
      </p>
    );
  }

  return (
    <BrandForm
      action={updateBrand.bind(null, brand.id)}
      defaultValues={{
        name: brand.name,
        website: brand.website ?? "",
        notes: brand.notes ?? "",
      }}
      submitLabel="Save changes"
      cancelHref={`/brands/${brand.id}`}
    />
  );
}
