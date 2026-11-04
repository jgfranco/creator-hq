"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { safeNextPath } from "@/lib/safe-redirect";
import { AuthSwitchLink } from "../auth-switch-link";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setPending(false);

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    // Read at submit time so the page needs no useSearchParams Suspense boundary
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(safeNextPath(next));
    router.refresh();
  }

  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-gray-900 px-3 py-2 text-gray-50 disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <AuthSwitchLink href="/sign-in">Sign in</AuthSwitchLink>
      </p>
    </main>
  );
}
