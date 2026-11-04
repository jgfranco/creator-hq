"use client";

import { useActionState, useState } from "react";
import { Role } from "@/generated/prisma/enums";
import { formatEnum } from "@/lib/format";
import { Field } from "../../form-field";
import type { InviteFormState } from "../actions";
import { ROLE_DESCRIPTIONS } from "./roles";

export function InviteForm({
  action,
}: {
  action: (
    state: InviteFormState,
    formData: FormData,
  ) => Promise<InviteFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: { email: "", role: "MANAGER" },
  });

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-wrap items-start gap-3">
        <div className="min-w-64 flex-1">
          <Field label="Email" name="email" errors={state.fieldErrors?.email}>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              defaultValue={state.values?.email}
              aria-invalid={!!state.fieldErrors?.email}
              aria-describedby={
                state.fieldErrors?.email ? "email-error" : undefined
              }
              className="w-full rounded border px-3 py-2"
            />
          </Field>
        </div>
        <div>
          <Field label="Role" name="role" errors={state.fieldErrors?.role}>
            <select
              id="role"
              name="role"
              defaultValue={state.values?.role}
              className="rounded border bg-background px-3 py-2"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {formatEnum(role)} — {ROLE_DESCRIPTIONS[role]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 rounded bg-gray-900 px-4 py-2 text-sm text-gray-50 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create invite link"}
        </button>
      </form>

      {state.message && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      {state.invite && (
        <div
          role="status"
          className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <p className="mb-2">
            Invite created for <strong>{state.invite.email}</strong>. Send them
            this link. It works once, expires in 7 days, and won&apos;t be shown
            again.
          </p>
          <CopyField value={state.invite.link} />
        </div>
      )}
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  }

  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={value}
        aria-label="Invite link"
        onFocus={(event) => event.currentTarget.select()}
        className="min-w-0 flex-1 rounded border bg-background px-2 py-1 font-mono text-xs text-gray-900"
      />
      <button
        type="button"
        onClick={copy}
        className="rounded border border-green-300 px-2 py-1 text-xs hover:bg-green-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
