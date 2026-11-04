"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field } from "./form-field";
import type { WorkspaceFormState } from "./settings/actions";

type WorkspaceValues = NonNullable<WorkspaceFormState["values"]>;

export function WorkspaceForm({
  action,
  defaultValues,
  currencyOptions,
  currencyLockedReason,
  readOnly = false,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: WorkspaceFormState,
    formData: FormData,
  ) => Promise<WorkspaceFormState>;
  defaultValues: WorkspaceValues;
  currencyOptions: { code: string; label: string }[];
  // When set, the currency is shown but can't be changed
  currencyLockedReason?: string;
  readOnly?: boolean;
  submitLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: defaultValues,
  });
  const currencyDisabled = readOnly || !!currencyLockedReason;

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      {state.message && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}
      {state.saved && !pending && (
        <p
          role="status"
          className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          Settings saved.
        </p>
      )}

      <Field
        label="Workspace name"
        name="name"
        errors={state.fieldErrors?.name}
      >
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          disabled={readOnly}
          defaultValue={state.values?.name}
          aria-invalid={!!state.fieldErrors?.name}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          className="w-full rounded border px-3 py-2 disabled:opacity-60"
        />
      </Field>

      <Field
        label="Currency"
        name="currency"
        errors={state.fieldErrors?.currency}
      >
        <select
          id="currency"
          name="currency"
          disabled={currencyDisabled}
          defaultValue={state.values?.currency}
          aria-invalid={!!state.fieldErrors?.currency}
          aria-describedby={
            state.fieldErrors?.currency
              ? "currency-error"
              : currencyLockedReason
                ? "currency-locked"
                : undefined
          }
          className="w-full rounded border bg-background px-3 py-2 disabled:opacity-60"
        >
          {currencyOptions.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        {/* Disabled fields aren't submitted, so send the current value along */}
        {currencyDisabled && !readOnly && (
          <input type="hidden" name="currency" value={state.values?.currency} />
        )}
        {currencyLockedReason && (
          <p id="currency-locked" className="mt-1 text-sm text-gray-500">
            {currencyLockedReason}
          </p>
        )}
      </Field>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-gray-50 disabled:opacity-50"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
          {cancelHref && (
            <Link
              href={cancelHref}
              className="text-sm text-gray-600 hover:text-gray-950"
            >
              Cancel
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
