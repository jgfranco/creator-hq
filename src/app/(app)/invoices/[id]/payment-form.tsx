"use client";

import { useActionState } from "react";
import { PaymentMethod } from "@/generated/prisma/enums";
import { formatEnum } from "@/lib/format";
import { Field } from "../../form-field";
import type { PaymentFormState, PaymentValues } from "../actions";

const inputClass = "w-full rounded border px-3 py-2";

export function PaymentForm({
  action,
  currency,
  defaultValues,
}: {
  action: (
    state: PaymentFormState,
    formData: FormData,
  ) => Promise<PaymentFormState>;
  currency: string;
  defaultValues: PaymentValues;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // After a successful save, start over from the (refreshed) defaults
  const values = state.savedAt
    ? defaultValues
    : (state.values ?? defaultValues);
  const errors = state.fieldErrors ?? {};

  const fieldProps = (name: keyof PaymentValues) => ({
    id: `payment-${name}`,
    name,
    defaultValue: values[name],
    "aria-invalid": !!errors[name],
  });

  return (
    <form
      key={`${state.savedAt ?? ""}${JSON.stringify(values)}`}
      action={formAction}
      className="grid grid-cols-2 gap-4 rounded border p-4 sm:grid-cols-4"
    >
      {state.message && (
        <p role="alert" className="col-span-full text-sm text-red-700">
          {state.message}
        </p>
      )}
      <Field
        label={`Amount (${currency})`}
        name="payment-amount"
        errors={errors.amount}
      >
        <input
          {...fieldProps("amount")}
          inputMode="decimal"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Paid on" name="payment-paidOn" errors={errors.paidOn}>
        <input
          {...fieldProps("paidOn")}
          type="date"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Method" name="payment-method" errors={errors.method}>
        <select {...fieldProps("method")} required className={inputClass}>
          {Object.values(PaymentMethod).map((method) => (
            <option key={method} value={method}>
              {formatEnum(method)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Reference"
        name="payment-reference"
        hint="Optional"
        errors={errors.reference}
      >
        <input
          {...fieldProps("reference")}
          maxLength={200}
          placeholder="Transaction ID"
          className={inputClass}
        />
      </Field>
      <div className="col-span-full">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Record payment"}
        </button>
      </div>
    </form>
  );
}
