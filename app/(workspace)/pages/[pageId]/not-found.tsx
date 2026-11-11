import Link from "next/link";

export default function PageNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <svg
          className="h-8 w-8 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-800">
          Page not found
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          This page doesn&apos;t exist or you don&apos;t have access to it.
        </p>
      </div>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-neutral-900 underline hover:no-underline"
      >
        Go to workspace
      </Link>
    </div>
  );
}
