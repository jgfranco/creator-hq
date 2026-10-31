"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = { href: string; children: React.ReactNode };

// usePathname suspends while prerendering dynamic routes (e.g. /brands/[id]),
// so the static shell renders an inactive link and the highlight streams in.
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<NavLinkView {...props} isActive={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink(props: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === props.href || pathname.startsWith(`${props.href}/`);
  return <NavLinkView {...props} isActive={isActive} />;
}

function NavLinkView({ href, children, isActive }: NavLinkProps & { isActive: boolean }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`rounded px-3 py-1.5 text-sm ${
        isActive ? "bg-gray-100 font-medium" : "text-gray-600 hover:text-black"
      }`}
    >
      {children}
    </Link>
  );
}
