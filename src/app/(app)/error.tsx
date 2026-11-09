"use client";

import { useEffect } from "react";
import Link from "next/link";

// Unexpected errors in app pages. The layout (nav) stays, so people can move on.
export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // In production, server errors only carry a digest (matching the server log),
  // never the message
  const digest =
    error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div role="alert" className="py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-gray-600">
        This page couldn&apos;t load. Try again, and if it keeps happening, let
        us know.
      </p>
      {digest && (
        <p className="mt-1 font-mono text-xs text-gray-500">
          Error reference: {digest}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-gray-50"
        >
          Try again
        </button>
        <Link href="/dashboard" className="rounded border px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
