import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-2 text-2xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter your account&apos;s email and we&apos;ll send you a link to choose
        a new password.
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
