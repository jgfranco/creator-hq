import { Suspense } from "react";
import Link from "next/link";
import { getCurrentMembership } from "@/lib/workspace";
import { NavLink } from "./nav-link";
import { SignOutButton } from "./sign-out-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              Creator HQ
            </Link>
            <nav className="flex gap-1">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/campaigns">Campaigns</NavLink>
              <NavLink href="/brands">Brands</NavLink>
              <NavLink href="/invoices">Invoices</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Suspense fallback={null}>
              <WorkspaceName />
            </Suspense>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}

async function WorkspaceName() {
  const membership = await getCurrentMembership();
  return <span className="text-sm text-gray-500">{membership.workspace.name}</span>;
}