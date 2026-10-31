import Link from "next/link";

export function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded px-3 py-1.5 ${active ? "bg-gray-100 font-medium" : "text-gray-600 hover:text-black"}`}
    >
      {children}
    </Link>
  );
}
