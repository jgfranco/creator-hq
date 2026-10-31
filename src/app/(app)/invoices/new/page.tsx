import { Suspense } from "react";
import Link from "next/link";
import {
  getNewInvoiceDefaults,
  listInvoiceableCampaigns,
} from "@/lib/invoices";
import { getCurrentMembership } from "@/lib/workspace";
import { formatMoney, toMoneyInput } from "@/lib/money";
import { addDays, toDateInput, today } from "@/lib/dates";
import { InvoiceForm } from "../invoice-form";
import { createInvoice } from "../actions";

const PAYMENT_TERMS_DAYS = 30;

export default function NewInvoicePage({
  searchParams,
}: PageProps<"/invoices/new">) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">New invoice</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <NewInvoice searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewInvoice({
  searchParams,
}: {
  searchParams: PageProps<"/invoices/new">["searchParams"];
}) {
  const [{ campaignId }, membership] = await Promise.all([
    searchParams,
    getCurrentMembership(),
  ]);

  if (membership.role === "VIEWER") {
    return (
      <p className="text-sm text-gray-600">
        You don&apos;t have permission to create invoices.
      </p>
    );
  }
  if (typeof campaignId !== "string" || !campaignId) {
    return <ChooseCampaign />;
  }

  const { campaign, invoicedCents, remainingCents } =
    await getNewInvoiceDefaults(campaignId);
  const currency = membership.workspace.currency;
  const issueDate = today();

  return (
    <>
      <p className="mb-6 text-sm text-gray-600">
        Billing{" "}
        <span className="font-medium text-black">{campaign.brand.name}</span>{" "}
        for{" "}
        <Link href={`/campaigns/${campaign.id}`} className="underline">
          {campaign.title}
        </Link>
        {campaign.feeCents !== null && (
          <>
            {" "}
            · fee {formatMoney(campaign.feeCents, currency)}, already invoiced{" "}
            {formatMoney(invoicedCents, currency)}
          </>
        )}
      </p>
      <InvoiceForm
        action={createInvoice.bind(null, campaign.id)}
        currency={currency}
        defaultValues={{
          issueDate: toDateInput(issueDate),
          dueDate: toDateInput(addDays(issueDate, PAYMENT_TERMS_DAYS)),
          notes: "",
          lineItems: [
            {
              description: campaign.title,
              quantity: "1",
              unitPrice: remainingCents
                ? toMoneyInput(remainingCents, currency)
                : "",
            },
          ],
        }}
        submitLabel="Save draft"
        cancelHref={`/campaigns/${campaign.id}`}
      />
    </>
  );
}

// Step 1: pick the campaign. A plain GET form, so it works without JavaScript.
async function ChooseCampaign() {
  const campaigns = await listInvoiceableCampaigns();

  if (campaigns.length === 0) {
    return (
      <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
        Invoices are created for a campaign.{" "}
        <Link href="/campaigns/new" className="underline">
          Create a campaign
        </Link>{" "}
        first.
      </p>
    );
  }

  return (
    <form action="/invoices/new" className="max-w-lg space-y-4">
      <div>
        <label htmlFor="campaignId" className="mb-1 block text-sm font-medium">
          Which campaign is this invoice for?
        </label>
        <select
          id="campaignId"
          name="campaignId"
          required
          defaultValue=""
          className="w-full rounded border px-3 py-2"
        >
          <option value="" disabled>
            Choose a campaign…
          </option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.brand.name} — {campaign.title}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-sm text-white"
      >
        Continue
      </button>
    </form>
  );
}
