"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== String(form.get("confirm"))) {
      setError("The passwords don't match.");
      return;
    }

    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);

    if (error) {
      setError(
        error.code === "INVALID_TOKEN"
          ? "This reset link is invalid or has expired. Request a new one."
          : (error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div role="status" className="space-y-4 text-sm">
        <p>
          Your password has been changed, and you&apos;ve been signed out
          everywhere.
        </p>
        <Link
          href="/sign-in"
          className="inline-block rounded bg-gray-900 px-4 py-2 text-gray-50"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm">New password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm">Confirm new password</span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}{" "}
          {error.includes("Request a new one") && (
            <Link href="/forgot-password" className="underline">
              Send a new link
            </Link>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-gray-900 px-3 py-2 text-gray-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
