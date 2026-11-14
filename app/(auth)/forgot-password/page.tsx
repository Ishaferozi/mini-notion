import { Suspense } from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = {
  title: "Reset password – Mini Notion",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-[var(--color-sidebar-bg)] px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-lg font-bold shadow-md">
            N
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-sidebar-text)]">
            Reset your password
          </h1>
          <p className="text-sm text-[var(--color-sidebar-text-muted)] text-center">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-sidebar-border)] bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-neutral-100" />}>
            <ForgotPasswordForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--color-sidebar-text-muted)]">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
