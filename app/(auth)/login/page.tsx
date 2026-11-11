import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in – Mini Notion",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white text-lg font-bold">
            N
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Sign in to Mini Notion
          </h1>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-neutral-100" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-neutral-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
