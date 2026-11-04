// Only same-site paths ("/invite/abc"), never "//evil.com" or "https://…",
// so a ?next= link can't send people to another site after signing in.
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard",
) {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}
