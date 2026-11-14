import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Set new password – Mini Notion",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-[var(--color-sidebar-bg)] px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-lg font-bold shadow-md">
            N
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-sidebar-text)]">
            Set a new password
          </h1>
        </div>

        <div className="rounded-2xl border border-[var(--color-sidebar-border)] bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-neutral-100" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
