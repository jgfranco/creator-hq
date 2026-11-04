"use client";

import { useActionState } from "react";
import { Role } from "@/generated/prisma/enums";
import { formatEnum } from "@/lib/format";
import type { MemberActionResult } from "../actions";

export function RoleForm({
  action,
  role,
  label,
}: {
  action: (
    state: MemberActionResult,
    formData: FormData,
  ) => Promise<MemberActionResult>;
  role: Role;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction}>
      <div className="flex items-center gap-2">
        <select
          name="role"
          defaultValue={role}
          aria-label={label}
          className="rounded border bg-background px-2 py-1 text-sm"
        >
          {Object.values(Role).map((value) => (
            <option key={value} value={value}>
              {formatEnum(value)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="mt-1 max-w-xs text-xs text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
