"use client";

import "./globals.css";

// Errors in the root layout itself; replaces the whole document
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <html lang="en">
      <body>
        <title>Something went wrong · Creator HQ</title>
        <main role="alert" className="mx-auto mt-24 max-w-md px-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-600">
            Creator HQ couldn&apos;t load. Please try again.
          </p>
          {digest && (
            <p className="mt-1 font-mono text-xs text-gray-500">
              Error reference: {digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            className="mt-6 rounded bg-gray-900 px-4 py-2 text-sm text-gray-50"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
