import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/workspace";

const FEATURES = [
  {
    title: "Deals and deliverables",
    body: "Track every brand deal from first email to posted content: fees, dates, and each reel, video or story with its due date and revisions.",
  },
  {
    title: "Invoices and payments",
    body: "Bill from a campaign in a couple of clicks, print or save as PDF, record payments as they land, and see what's overdue.",
  },
  {
    title: "Your team, your workspaces",
    body: "Invite a manager or assistant with the right access, and keep separate workspaces for separate businesses.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <span className="font-semibold">Creator HQ</span>
        <Suspense fallback={<SignedOutNav />}>
          <Nav />
        </Suspense>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-20 sm:py-28">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            The back office for your brand deals
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600">
            Creator HQ keeps your campaigns, deliverables, invoices and payments
            in one place, so you always know what&apos;s due, what&apos;s owed
            and what&apos;s next.
          </p>
          <div className="mt-8">
            <Suspense fallback={<SignedOutCta />}>
              <Cta />
            </Suspense>
          </div>
        </section>

        <section className="grid gap-8 border-t py-14 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{feature.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-gray-500">
        Creator HQ
      </footer>
    </div>
  );
}

async function Nav() {
  const session = await getSession();
  if (!session) return <SignedOutNav />;
  return (
    <Link
      href="/dashboard"
      className="text-sm text-gray-600 hover:text-gray-950"
    >
      Dashboard
    </Link>
  );
}

function SignedOutNav() {
  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/sign-in" className="text-gray-600 hover:text-gray-950">
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="rounded bg-gray-900 px-3 py-1.5 text-gray-50"
      >
        Sign up
      </Link>
    </nav>
  );
}

async function Cta() {
  const session = await getSession();
  if (!session) return <SignedOutCta />;
  return (
    <Link
      href="/dashboard"
      className="rounded bg-gray-900 px-5 py-3 text-gray-50"
    >
      Go to your dashboard
    </Link>
  );
}

function SignedOutCta() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link
        href="/sign-up"
        className="rounded bg-gray-900 px-5 py-3 text-gray-50"
      >
        Create your account
      </Link>
      <Link
        href="/sign-in"
        className="text-gray-600 underline hover:text-gray-950"
      >
        I already have an account
      </Link>
    </div>
  );
}
