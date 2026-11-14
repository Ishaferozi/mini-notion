import Link from "next/link";

export const metadata = {
  title: "Access denied – Mini Notion",
};

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-[var(--color-sidebar-bg)] px-4 py-16">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Access denied</h1>
          <p className="mt-2 text-sm text-neutral-500">
            You don&apos;t have permission to view this page. This area requires
            a higher role in your organization.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            Go to your dashboard
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </main>
  );
}
