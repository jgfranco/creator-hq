"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field } from "../form-field";
import { CampaignStatus } from "@/generated/prisma/enums";
import { formatEnum } from "@/lib/format";
import type { CampaignFormState } from "./actions";

type CampaignValues = NonNullable<CampaignFormState["values"]>;

const emptyValues: CampaignValues = {
  title: "",
  brandId: "",
  status: "LEAD",
  fee: "",
  startDate: "",
  endDate: "",
};

const inputClass = "w-full rounded border px-3 py-2";

export function CampaignForm({
  action,
  brands,
  currency,
  defaultValues = emptyValues,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: CampaignFormState,
    formData: FormData,
  ) => Promise<CampaignFormState>;
  brands: { id: string; name: string }[];
  currency: string;
  defaultValues?: CampaignValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: defaultValues,
  });
  const values = state.values ?? defaultValues;
  const errors = state.fieldErrors ?? {};

  // Shared a11y wiring so each input only declares what's specific to it
  const fieldProps = (name: keyof CampaignValues) => ({
    id: name,
    name,
    defaultValue: values[name],
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  if (brands.length === 0) {
    return (
      <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
        Add a brand first, then create campaigns for it.{" "}
        <Link href="/brands/new" className="underline">
          New brand
        </Link>
      </p>
    );
  }

  return (
    // key resets uncontrolled inputs to the returned values after a failed submit
    <form
      key={JSON.stringify(values)}
      action={formAction}
      className="max-w-lg space-y-5"
    >
      {state.message && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      <Field label="Title" name="title" errors={errors.title}>
        <input
          {...fieldProps("title")}
          required
          maxLength={150}
          className={inputClass}
        />
      </Field>

      <Field label="Brand" name="brandId" errors={errors.brandId}>
        <select {...fieldProps("brandId")} required className={inputClass}>
          <option value="" disabled>
            Choose a brand…
          </option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Status" name="status" errors={errors.status}>
        <select {...fieldProps("status")} className={inputClass}>
          {Object.values(CampaignStatus).map((status) => (
            <option key={status} value={status}>
              {formatEnum(status)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={`Fee (${currency})`}
        name="fee"
        hint="Optional"
        errors={errors.fee}
      >
        <input
          {...fieldProps("fee")}
          inputMode="decimal"
          placeholder="0.00"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Start date"
          name="startDate"
          hint="Optional"
          errors={errors.startDate}
        >
          <input
            {...fieldProps("startDate")}
            type="date"
            className={inputClass}
          />
        </Field>
        <Field
          label="End date"
          name="endDate"
          hint="Optional"
          errors={errors.endDate}
        >
          <input
            {...fieldProps("endDate")}
            type="date"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="text-sm text-gray-600 hover:text-black"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
