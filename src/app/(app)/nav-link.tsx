"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

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