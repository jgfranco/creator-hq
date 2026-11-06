// ?q= from a list page: trimmed, capped, and undefined when empty
export function parseSearch(
  value: string | string[] | undefined,
): string | undefined {
  const q = (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100);
  return q || undefined;
}

// "INV-0042", "inv 42", "#42" or "42" → 42, so invoices can be found by number
export function invoiceNumberFromSearch(q: string): number | undefined {
  const match = /^(?:inv[-\s]?|#)?0*(\d{1,9})$/i.exec(q.trim());
  return match ? Number(match[1]) : undefined;
}

// Builds a list URL, leaving out empty params: href("/campaigns", { status, q })
export function listHref(
  path: string,
  params: Record<string, string | undefined>,
) {
  const search = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => !!entry[1],
    ),
  ).toString();
  return search ? `${path}?${search}` : path;
}

// Prisma's `contains` becomes a SQL LIKE without escaping, so "%" or "_" would act
// as wildcards; escape them so they're matched literally
export function likeEscape(q: string) {
  return q.replace(/[\\%_]/g, "\\$&");
}
