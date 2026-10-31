"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { formatMoney, parseMoney } from "@/lib/money";
import { MAX_LINE_ITEMS } from "@/lib/invoice-rules";
import { Field } from "../form-field";
import type {
  InvoiceFormState,
  InvoiceValues,
  LineItemValues,
} from "./actions";

const inputClass = "w-full rounded border px-3 py-2";

type Row = LineItemValues & { key: number };

export function InvoiceForm({
  action,
  currency,
  defaultValues,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: InvoiceFormState,
    formData: FormData,
  ) => Promise<InvoiceFormState>;
  currency: string;
  defaultValues: InvoiceValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: defaultValues,
  });
  const values = state.values ?? defaultValues;

  return (
    // key remounts the form (and its line-item state) with the returned values after a failed submit
    <InvoiceFormFields
      key={JSON.stringify(values)}
      formAction={formAction}
      pending={pending}
      state={state}
      values={values}
      currency={currency}
      submitLabel={submitLabel}
      cancelHref={cancelHref}
    />
  );
}

function InvoiceFormFields({
  formAction,
  pending,
  state,
  values,
  currency,
  submitLabel,
  cancelHref,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: InvoiceFormState;
  values: InvoiceValues;
  currency: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const errors = state.fieldErrors ?? {};
  const [rows, setRows] = useState<Row[]>(() =>
    (values.lineItems.length
      ? values.lineItems
      : [{ description: "", quantity: "1", unitPrice: "" }]
    ).map((item, key) => ({ ...item, key })),
  );
  const [nextKey, setNextKey] = useState(rows.length);

  const updateRow = (key: number, patch: Partial<LineItemValues>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  const addRow = () => {
    setRows((current) => [
      ...current,
      { key: nextKey, description: "", quantity: "1", unitPrice: "" },
    ]);
    setNextKey((k) => k + 1);
  };
  const removeRow = (key: number) =>
    setRows((current) => current.filter((row) => row.key !== key));

  // Live preview only; the server recomputes the total from the parsed line items
  const lineTotal = (row: Row) => {
    const unit = parseMoney(row.unitPrice, currency);
    const qty = /^\d+$/.test(row.quantity.trim()) ? Number(row.quantity) : null;
    return unit === null || qty === null ? null : unit * qty;
  };
  const totals = rows.map(lineTotal);
  const total = totals.every((t) => t !== null)
    ? totals.reduce<number>((s, t) => s + (t ?? 0), 0)
    : null;

  const fieldProps = (name: "issueDate" | "dueDate" | "notes") => ({
    id: name,
    name,
    defaultValue: values[name],
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {state.message && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      <div className="grid max-w-md grid-cols-2 gap-4">
        <Field label="Issue date" name="issueDate" errors={errors.issueDate}>
          <input
            {...fieldProps("issueDate")}
            type="date"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Due date" name="dueDate" errors={errors.dueDate}>
          <input
            {...fieldProps("dueDate")}
            type="date"
            required
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Line items</legend>
        {errors.lineItems?.[0] && (
          <p id="lineItems-error" className="mb-2 text-sm text-red-600">
            {errors.lineItems[0]}
          </p>
        )}
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="pb-1 font-medium">Description</th>
              <th className="w-20 pb-1 font-medium">Qty</th>
              <th className="w-36 pb-1 font-medium">Price ({currency})</th>
              <th className="w-32 pb-1 text-right font-medium">Amount</th>
              <th className="w-16 pb-1" aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const error = (field: string) =>
                errors[`lineItems.${index}.${field}`]?.[0];
              const rowErrors = [
                error("description"),
                error("quantity"),
                error("unitAmountCents"),
              ].filter(Boolean);
              const amount = totals[index];
              return (
                <tr key={row.key} className="align-top">
                  <td className="py-1 pr-2">
                    <input
                      name="lineItems.description"
                      value={row.description}
                      onChange={(e) =>
                        updateRow(row.key, { description: e.target.value })
                      }
                      aria-label={`Line ${index + 1} description`}
                      aria-invalid={!!error("description")}
                      required
                      maxLength={200}
                      placeholder="e.g. Instagram reel"
                      className={inputClass}
                    />
                    {rowErrors.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {rowErrors.join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      name="lineItems.quantity"
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(row.key, { quantity: e.target.value })
                      }
                      aria-label={`Line ${index + 1} quantity`}
                      aria-invalid={!!error("quantity")}
                      inputMode="numeric"
                      required
                      className={inputClass}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      name="lineItems.unitPrice"
                      value={row.unitPrice}
                      onChange={(e) =>
                        updateRow(row.key, { unitPrice: e.target.value })
                      }
                      aria-label={`Line ${index + 1} price`}
                      aria-invalid={!!error("unitAmountCents")}
                      inputMode="decimal"
                      placeholder="0.00"
                      required
                      className={inputClass}
                    />
                  </td>
                  <td className="py-3 text-right tabular-nums text-gray-700">
                    {amount === null ? "—" : formatMoney(amount, currency)}
                  </td>
                  <td className="py-1 text-right">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        aria-label={`Remove line ${index + 1}`}
                        className="px-2 py-2 text-xs text-gray-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-2">
                {rows.length < MAX_LINE_ITEMS && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="text-sm underline"
                  >
                    Add line
                  </button>
                )}
              </td>
              <td className="pt-2 text-right font-semibold tabular-nums">
                {total === null ? "—" : formatMoney(total, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </fieldset>

      <div className="max-w-lg">
        <Field
          label="Notes"
          name="notes"
          hint="Optional — payment details, PO number, thank-you"
          errors={errors.notes}
        >
          <textarea
            {...fieldProps("notes")}
            rows={4}
            maxLength={2000}
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
