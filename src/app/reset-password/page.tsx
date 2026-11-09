import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

// The emailed link goes to /api/auth/reset-password/<token>, which redirects here
// with ?token=… (or ?error=INVALID_TOKEN when it's expired or already used)
export default function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-semibold">Choose a new password</h1>
      <Suspense fallback={null}>
        <ResetPassword searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ResetPassword({
  searchParams,
}: {
  searchParams: PageProps<"/reset-password">["searchParams"];
}) {
  const { token, error } = await searchParams;

  if (typeof token !== "string" || !token || error) {
    return (
      <div role="alert" className="space-y-4 text-sm">
        <p>This reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="underline">
          Send a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
