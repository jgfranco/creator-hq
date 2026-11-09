import Link from "next/link";

// notFound() from app pages, e.g. a campaign that doesn't exist or belongs to another
// workspace. Rendered inside the app layout, so the nav stays.
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">This page could not be found.</h1>
      <p className="mt-2 text-sm text-gray-600">
        It may have been deleted, or it belongs to a different workspace. If so,
        switch workspaces from the menu at the top right.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block rounded bg-gray-900 px-4 py-2 text-sm text-gray-50"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
