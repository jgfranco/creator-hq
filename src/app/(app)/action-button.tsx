"use client";

import { useState, useTransition } from "react";

type ActionResult = { error?: string } | void;

const VARIANTS = {
  default: "border hover:bg-gray-50",
  primary: "border border-black bg-black text-white hover:bg-gray-800",
  danger: "border border-red-200 text-red-700 hover:bg-red-50",
};

// Runs a server action with its arguments already bound (e.g. sendInvoice.bind(null, id)),
// optionally after a confirm(), and shows the error message the action returns.
export function ActionButton({
  action,
  label,
  pendingLabel = `${label}…`,
  confirmMessage,
  variant = "default",
  size = "md",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  pendingLabel?: string;
  confirmMessage?: string;
  variant?: keyof typeof VARIANTS;
  size?: "sm" | "md";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`rounded disabled:opacity-50 ${VARIANTS[variant]} ${
          size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        {pending ? pendingLabel : label}
      </button>
      {error && (
        <span
          role="alert"
          className="mt-1 max-w-xs text-right text-xs text-red-600"
        >
          {error}
        </span>
      )}
    </span>
  );
}

export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  size = "md",
}: {
  action: () => Promise<ActionResult>;
  confirmMessage: string;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <ActionButton
      action={action}
      label={label}
      pendingLabel="Deleting…"
      confirmMessage={confirmMessage}
      variant="danger"
      size={size}
    />
  );
}
