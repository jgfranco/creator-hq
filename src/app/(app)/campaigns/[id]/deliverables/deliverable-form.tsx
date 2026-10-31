"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  DeliverableStatus,
  DeliverableType,
  Platform,
} from "@/generated/prisma/enums";
import { formatEnum, formatPlatform } from "@/lib/format";
import { Field } from "../../../form-field";
import type { DeliverableFormState } from "./actions";

type DeliverableValues = NonNullable<DeliverableFormState["values"]>;

const emptyDeliverableValues: DeliverableValues = {
  type: "",
  platform: "",
  status: "NOT_STARTED",
  dueDate: "",
  scheduledFor: "",
  postedAt: "",
  liveUrl: "",
  revisionCount: "0",
  notes: "",
};

const inputClass = "w-full rounded border px-3 py-2";

export function DeliverableForm({
  action,
  defaultValues = emptyDeliverableValues,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: DeliverableFormState,
    formData: FormData,
  ) => Promise<DeliverableFormState>;
  defaultValues?: DeliverableValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: defaultValues,
  });
  const values = state.values ?? defaultValues;
  const errors = state.fieldErrors ?? {};

  const fieldProps = (name: keyof DeliverableValues) => ({
    id: name,
    name,
    defaultValue: values[name],
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

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

      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" name="type" errors={errors.type}>
          <EnumSelect
            {...fieldProps("type")}
            options={DeliverableType}
            placeholder="Choose a type…"
          />
        </Field>
        <Field label="Platform" name="platform" errors={errors.platform}>
          <EnumSelect
            {...fieldProps("platform")}
            options={Platform}
            label={formatPlatform}
            placeholder="Choose a platform…"
          />
        </Field>
      </div>

      <Field label="Status" name="status" errors={errors.status}>
        <EnumSelect {...fieldProps("status")} options={DeliverableStatus} />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Due"
          name="dueDate"
          hint="Optional"
          errors={errors.dueDate}
        >
          <input
            {...fieldProps("dueDate")}
            type="date"
            className={inputClass}
          />
        </Field>
        <Field
          label="Scheduled"
          name="scheduledFor"
          hint="Optional"
          errors={errors.scheduledFor}
        >
          <input
            {...fieldProps("scheduledFor")}
            type="date"
            className={inputClass}
          />
        </Field>
        <Field
          label="Posted"
          name="postedAt"
          hint="Optional"
          errors={errors.postedAt}
        >
          <input
            {...fieldProps("postedAt")}
            type="date"
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Live URL"
        name="liveUrl"
        hint="Optional"
        errors={errors.liveUrl}
      >
        <input
          {...fieldProps("liveUrl")}
          type="url"
          placeholder="https://"
          className={inputClass}
        />
      </Field>

      <Field
        label="Revisions"
        name="revisionCount"
        errors={errors.revisionCount}
      >
        <input
          {...fieldProps("revisionCount")}
          type="number"
          min={0}
          max={99}
          step={1}
          className="w-24 rounded border px-3 py-2"
        />
      </Field>

      <Field label="Notes" name="notes" hint="Optional" errors={errors.notes}>
        <textarea
          {...fieldProps("notes")}
          rows={4}
          maxLength={2000}
          className={inputClass}
        />
      </Field>

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

function EnumSelect({
  options,
  placeholder,
  label = formatEnum,
  ...props
}: React.ComponentProps<"select"> & {
  options: Record<string, string>;
  placeholder?: string;
  label?: (value: string) => string;
}) {
  return (
    <select {...props} required className={inputClass}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {Object.values(options).map((value) => (
        <option key={value} value={value}>
          {label(value)}
        </option>
      ))}
    </select>
  );
}
