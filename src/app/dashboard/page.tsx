import { Suspense } from "react";
import { SignOutButton } from "./sign-out-button";
import { getCurrentMembership } from "@/lib/workspace";

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
  const membership = await getCurrentMembership();
  const { workspace } = membership;

  return (
    <div className="space-y-4">
      <p>
        <strong>{workspace.name}</strong> · your role: {membership.role}
      </p>
      <SignOutButton />
    </div>
  );
}