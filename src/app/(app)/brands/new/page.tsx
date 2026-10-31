import { BrandForm } from "../brand-form";
import { createBrand } from "../actions";

export default function NewBrandPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">New brand</h1>
      <BrandForm action={createBrand} submitLabel="Create brand" cancelHref="/brands" />
    </div>
  );
}
