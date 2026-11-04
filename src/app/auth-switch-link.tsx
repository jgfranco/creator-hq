"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = { href: "/sign-in" | "/sign-up"; children: React.ReactNode };

// Link between sign-in and sign-up that keeps ?next= (e.g. back to an invite)
export function AuthSwitchLink(props: Props) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className="underline">
          {props.children}
        </Link>
      }
    >
      <LinkWithNext {...props} />
    </Suspense>
  );
}

function LinkWithNext({ href, children }: Props) {
  const next = useSearchParams().get("next");
  return (
    <Link
      href={next ? `${href}?next=${encodeURIComponent(next)}` : href}
      className="underline"
    >
      {children}
    </Link>
  );
}
