"use client";

import { useRef } from "react";

// A <details> dropdown: works without JS, and with JS closes once something
// inside is picked or the user clicks elsewhere.
export function Menu({
  summary,
  children,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  function close() {
    if (ref.current) ref.current.open = false;
  }

  return (
    <details
      ref={ref}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a, button")) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <summary className="cursor-pointer list-none rounded px-2 py-1 text-sm text-gray-600 hover:text-gray-950 [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-64 rounded border bg-background p-1 shadow-lg">
        {children}
      </div>
    </details>
  );
}
