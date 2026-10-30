"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createBrand, type BrandFormState } from "./actions";

const initialState: BrandFormState = {};

export function BrandForm() {
  const [state, formAction, pending] = useActionState(createBrand, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      {state.message && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Field label="Name" name="name" errors={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={state.values?.name}
          aria-invalid={!!state.fieldErrors?.name}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          className="w-full rounded border px-3 py-2"
        />
      </Field>

      <Field label="Website" name="website" hint="Optional" errors={state.fieldErrors?.website}>
        <input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={state.values?.website}
          aria-invalid={!!state.fieldErrors?.website}
          aria-describedby={state.fieldErrors?.website ? "website-error" : undefined}
          className="w-full rounded border px-3 py-2"
        />
      </Field>

      <Field label="Notes" name="notes" hint="Optional" errors={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={2000}
          defaultValue={state.values?.notes}
          aria-invalid={!!state.fieldErrors?.notes}
          aria-describedby={state.fieldErrors?.notes ? "notes-error" : undefined}
          className="w-full rounded border px-3 py-2"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Create brand"}
        </button>
        <Link href="/brands" className="text-sm text-gray-600 hover:text-black">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  errors,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label} {hint && <span className="font-normal text-gray-500">({hint})</span>}
      </label>
      {children}
      {errors?.[0] && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {errors[0]}
        </p>
      )}
    </div>
  );
}