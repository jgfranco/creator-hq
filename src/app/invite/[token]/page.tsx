import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/workspace";
import { getInvitationByToken } from "@/lib/members";
import { formatEnum } from "@/lib/format";
import { ActionButton } from "@/app/(app)/action-button";
import { SignOutButton } from "@/app/(app)/sign-out-button";
import { acceptInvitation } from "./actions";

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <main className="mx-auto mt-24 max-w-md px-4">
      <Suspense
        fallback={<p className="text-sm text-gray-500">Loading invite…</p>}
      >
        <Invite params={params} />
      </Suspense>
    </main>
  );
}

async function Invite({
  params,
}: {
  params: PageProps<"/invite/[token]">["params"];
}) {
  const { token } = await params;
  const [invite, session] = await Promise.all([
    getInvitationByToken(token),
    getSession(),
  ]);

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    const reason = !invite
      ? "This invite link isn't valid. It may have been revoked or replaced by a newer one."
      : invite.acceptedAt
        ? "This invite has already been used."
        : "This invite has expired.";
    return (
      <>
        <h1 className="mb-3 text-2xl font-semibold">Invite unavailable</h1>
        <p className="mb-6 text-sm text-gray-600">
          {reason} Ask the workspace owner to send you a new one.
        </p>
        <Link
          href={session ? "/dashboard" : "/sign-in"}
          className="text-sm underline"
        >
          {session ? "Go to your dashboard" : "Sign in"}
        </Link>
      </>
    );
  }

  const here = `/invite/${token}`;
  const next = encodeURIComponent(here);
  const emailMatches =
    session && session.user.email.toLowerCase() === invite.email.toLowerCase();

  return (
    <>
      <h1 className="mb-3 text-2xl font-semibold">
        Join {invite.workspace.name}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        {invite.invitedBy.name} invited <strong>{invite.email}</strong> to join
        as {/* "a Manager", "an Owner" */}
        {invite.role === "OWNER" ? "an" : "a"}{" "}
        {formatEnum(invite.role).toLowerCase()}.
      </p>

      {!session ? (
        <div className="flex gap-3">
          <Link
            href={`/sign-in?next=${next}`}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-gray-50"
          >
            Sign in to accept
          </Link>
          <Link
            href={`/sign-up?next=${next}`}
            className="rounded border px-4 py-2 text-sm"
          >
            Create an account
          </Link>
        </div>
      ) : emailMatches ? (
        <ActionButton
          action={acceptInvitation.bind(null, token)}
          label="Accept invite"
          pendingLabel="Joining…"
          variant="primary"
        />
      ) : (
        <div className="space-y-4">
          <p
            role="alert"
            className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            You&apos;re signed in as {session.user.email}, but this invite is
            for {invite.email}. Sign in with that email to accept it.
          </p>
          <SignOutButton redirectTo={`/sign-in?next=${next}`} />
        </div>
      )}
    </>
  );
}
