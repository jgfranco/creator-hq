"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
    >
      Print / PDF
    </button>
  );
}
