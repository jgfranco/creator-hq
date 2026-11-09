import { Suspense } from "react";
import type { Metadata } from "next";
import { RedirectIfSignedIn } from "../redirect-if-signed-in";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <Suspense fallback={null}>
        <RedirectIfSignedIn searchParams={searchParams} />
      </Suspense>
      <h1 className="mb-6 text-2xl font-semibold">Sign in to your account</h1>
      <SignInForm />
    </main>
  );
}
