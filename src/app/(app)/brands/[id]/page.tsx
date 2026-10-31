import { Suspense } from "react";
import Link from "next/link";
import { getBrand } from "@/lib/brands";
import { getCurrentMembership } from "@/lib/workspace";
import { formatEnum } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { setBrandArchived } from "../actions";

export default function BrandPage({ params }: PageProps<"/brands/[id]">) {
  return (
    <div>
      <Link href="/brands" className="mb-4 inline-block text-sm text-gray-600 hover:text-black">
        ← Brands
      </Link>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading brand…</p>}>
        <BrandView params={params} />
      </Suspense>
    </div>
  );
}

async function BrandView({ params }: { params: PageProps<"/brands/[id]">["params"] }) {
  const { id } = await params;
  const [brand, membership] = await Promise.all([getBrand(id), getCurrentMembership()]);
  const canEdit = membership.role !== "VIEWER";
  const isArchived = brand.archivedAt !== null;

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {brand.name}
            {isArchived && (
              <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 align-middle text-xs font-normal text-gray-600">
                Archived
              </span>
            )}
          </h1>
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
            >
              {brand.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href={`/brands/${brand.id}/edit`} className="rounded border px-3 py-2 text-sm">
              Edit
            </Link>
            <form action={setBrandArchived.bind(null, brand.id, !isArchived)}>
              <button type="submit" className="rounded border px-3 py-2 text-sm">
                {isArchived ? "Unarchive" : "Archive"}
              </button>
            </form>
          </div>
        )}
      </div>

      {brand.notes && <p className="mb-8 whitespace-pre-line text-sm text-gray-700">{brand.notes}</p>}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Contacts</h2>
        {brand.contacts.length === 0 ? (
          <p className="text-sm text-gray-500">No contacts yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {brand.contacts.map((contact) => (
              <li key={contact.id}>
                <span className="font-medium">{contact.name}</span>
                {contact.isPrimary && <span className="ml-2 text-xs text-gray-500">Primary</span>}
                {contact.title && <span className="block text-gray-500">{contact.title}</span>}
                {contact.email && <span className="block text-gray-500">{contact.email}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Campaigns</h2>
          {canEdit && !isArchived && (
            <Link href={`/campaigns/new?brandId=${brand.id}`} className="text-sm underline">
              New campaign
            </Link>
          )}
        </div>
        {brand.campaigns.length === 0 ? (
          <p className="text-sm text-gray-500">No campaigns with this brand yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-2 font-medium">Campaign</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Fee</th>
              </tr>
            </thead>
            <tbody>
              {brand.campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                      {campaign.title}
                    </Link>
                  </td>
                  <td className="py-2">{formatEnum(campaign.status)}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMoney(campaign.feeCents, membership.workspace.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
