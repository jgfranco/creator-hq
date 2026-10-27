import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default function DashboardPage() {
  return (
    <main className="mx-auto mt-24 max-w-2xl px-4">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <CurrentUser />
      </Suspense>
    </main>
  );
}

async function CurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-4">
      <p>
        Signed in as <strong>{session.user.name}</strong> ({session.user.email})
      </p>
      <SignOutButton />
    </div>
  );
}