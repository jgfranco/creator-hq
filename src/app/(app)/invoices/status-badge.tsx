import { formatEnum } from "@/lib/format";
import { isOverdue } from "@/lib/invoice-rules";
import { today } from "@/lib/dates";
import type { InvoiceStatus } from "@/generated/prisma/enums";

const STYLES: Record<InvoiceStatus | "OVERDUE", string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-50 text-blue-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-800",
  PAID: "bg-green-50 text-green-700",
  VOID: "bg-gray-100 text-gray-500 line-through",
  OVERDUE: "bg-red-50 text-red-700",
};

export function InvoiceStatusBadge({
  status,
  dueDate,
}: {
  status: InvoiceStatus;
  dueDate: Date;
}) {
  const overdue = isOverdue({ status, dueDate }, today());
  const key = overdue ? "OVERDUE" : status;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STYLES[key]}`}>
      {overdue
        ? `Overdue${status === "PARTIALLY_PAID" ? " (part paid)" : ""}`
        : formatEnum(status)}
    </span>
  );
}
