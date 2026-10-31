"use client";

import { useTransition } from "react";

// Takes a server action with its arguments already bound, e.g. deleteCampaign.bind(null, id)
export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  size = "md",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(() => action());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 ${
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
      }`}
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}
