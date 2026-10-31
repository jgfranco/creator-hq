import { Suspense } from "react";
import Link from "next/link";
import { listBrands } from "@/lib/brands";

export default function BrandsPage({ searchParams }: PageProps<"/brands">) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Brands</h1>
        <Link href="/brands/new" className="rounded bg-black px-3 py-2 text-sm text-white">
          New brand
        </Link>
      </div>

      <Suspense fallback={<p className="text-sm text-gray-500">Loading brands…</p>}>
        <BrandsView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BrandsView({
  searchParams,
}: {
  searchParams: PageProps<"/brands">["searchParams"];
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const brands = await listBrands({ archived: showArchived });

  return (
    <>
      <div className="mb-4 flex gap-1 text-sm">
        <FilterTab href="/brands" active={!showArchived}>Active</FilterTab>
        <FilterTab href="/brands?archived=1" active={showArchived}>Archived</FilterTab>
      </div>

      {brands.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
          {showArchived
            ? "No archived brands."
            : "No brands yet. Add the companies you work with to start tracking deals."}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Website</th>
              <th className="py-2 font-medium">Primary contact</th>
              <th className="py-2 text-right font-medium">Campaigns</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => {
              const contact = brand.contacts[0];
              return (
                <tr key={brand.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">
                    <Link href={`/brands/${brand.id}`} className="hover:underline">
                      {brand.name}
                    </Link>
                  </td>
                  <td className="py-2">
                    {brand.website ? (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {brand.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2">
                    {contact ? (
                      <>
                        {contact.name}
                        {contact.email && (
                          <span className="block text-xs text-gray-500">{contact.email}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{brand._count.campaigns}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

function FilterTab({
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