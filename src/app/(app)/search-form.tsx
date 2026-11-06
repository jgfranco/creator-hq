import Link from "next/link";

// A plain GET form, so search works without JS and the results are linkable.
// `keep` carries the list's other params (e.g. the active filter) along.
export function SearchForm({
  action,
  q,
  placeholder,
  keep = {},
}: {
  action: string;
  q?: string;
  placeholder: string;
  keep?: Record<string, string | undefined>;
}) {
  const clearHref = new URLSearchParams(
    Object.entries(keep).filter(
      (entry): entry is [string, string] => !!entry[1],
    ),
  ).toString();

  return (
    <form
      action={action}
      role="search"
      className="mb-4 flex items-center gap-2"
    >
      {Object.entries(keep).map(
        ([name, value]) =>
          value && <input key={name} type="hidden" name={name} value={value} />,
      )}
      <input
        type="search"
        name="q"
        defaultValue={q}
        maxLength={100}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full max-w-sm rounded border bg-background px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Search
      </button>
      {q && (
        <Link
          href={clearHref ? `${action}?${clearHref}` : action}
          className="text-sm text-gray-600 hover:text-gray-950"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
