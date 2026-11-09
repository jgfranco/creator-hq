import { requireSession } from "@/lib/workspace";
import { ResendVerificationButton } from "../resend-verification-button";

export async function VerifyEmailBanner() {
  const { user } = await requireSession();
  if (user.emailVerified) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-sm text-amber-800 print:hidden">
      <p className="mx-auto max-w-5xl px-4 py-2">
        Please verify your email address. We sent a link to{" "}
        <strong>{user.email}</strong>.{" "}
        <ResendVerificationButton email={user.email} />
      </p>
    </div>
  );
}
