import { redirect } from "next/navigation";
import { getSession } from "@/lib/workspace";
import { safeNextPath } from "@/lib/safe-redirect";

// For pages only signed-out people need (sign in, sign up): render inside a
// <Suspense> so the form itself stays in the static shell.
export async function RedirectIfSignedIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const [session, { next }] = await Promise.all([getSession(), searchParams]);
  if (session) {
    redirect(safeNextPath(Array.isArray(next) ? next[0] : next));
  }
  return null;
}
