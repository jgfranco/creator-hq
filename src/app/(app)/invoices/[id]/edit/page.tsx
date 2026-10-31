import { Suspense } from "react";
import Link from "next/link";
import { getInvoice } from "@/lib/invoices";
import { getCurrentMembership } from "@/lib/workspace";
import { isEditable } from "@/lib/invoice-rules";
import { toMoneyInput } from "@/lib/money";
import { toDateInput } from "@/lib/dates";
import { InvoiceForm } from "../../invoice-form";
import { updateInvoice } from "../../actions";

export default function EditInvoicePage({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Edit invoice</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <EditInvoice params={params} />
      </Suspense>
    </div>
  );
}

async function EditInvoice({
  params,
}: {
  params: PageProps<"/invoices/[id]/edit">["params"];
}) {
  const { id } = await params;
  const [invoice, membership] = await Promise.all([
    getInvoice(id),
    getCurrentMembership(),
  ]);

  if (membership.role === "VIEWER") {
    return (
      <p className="text-sm text-gray-600">
        You don&apos;t have permission to edit invoices.
      </p>
    );
  }
  if (!isEditable(invoice.status)) {
    return (
      <p className="text-sm text-gray-600">
        Only drafts can be edited; this invoice has already been sent.{" "}
        <Link href={`/invoices/${invoice.id}`} className="underline">
          Back to the invoice
        </Link>
      </p>
    );
  }

  return (
    <InvoiceForm
      action={updateInvoice.bind(null, invoice.id)}
      currency={invoice.currency}
      defaultValues={{
        issueDate: toDateInput(invoice.issueDate),
        dueDate: toDateInput(invoice.dueDate),
        notes: invoice.notes ?? "",
        lineItems: invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: toMoneyInput(item.unitAmountCents, invoice.currency),
        })),
      }}
      submitLabel="Save changes"
      cancelHref={`/invoices/${invoice.id}`}
    />
  );
}
