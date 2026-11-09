import { Suspense } from "react";
import type { Metadata } from "next";
import { RedirectIfSignedIn } from "../redirect-if-signed-in";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <Suspense fallback={null}>
        <RedirectIfSignedIn searchParams={searchParams} />
      </Suspense>
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <SignUpForm />
    </main>
  );
}
