import Link from "next/link";

// URLs that don't match any route
export default function NotFound() {
  return (
    <main className="mx-auto mt-24 max-w-md px-4 text-center">
      <p className="text-sm font-medium text-gray-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold">
        This page could not be found.
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Check the address, or start again from home.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded bg-gray-900 px-4 py-2 text-sm text-gray-50"
      >
        Go home
      </Link>
    </main>
  );
}
