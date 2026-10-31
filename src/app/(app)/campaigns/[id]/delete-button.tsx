"use client";

import { useTransition } from "react";
import { deleteCampaign } from "../actions";

export function DeleteCampaignButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Delete "${title}" and all its deliverables? This can't be undone.`,
      )
    )
      return;
    startTransition(() => deleteCampaign(id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
