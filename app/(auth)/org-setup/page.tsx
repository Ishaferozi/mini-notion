import { Suspense } from "react";
import { OrgSetupForm } from "./OrgSetupForm";

export const metadata = {
  title: "Set up your organization – Mini Notion",
};

export default function OrgSetupPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-[var(--color-sidebar-bg)] px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-xl font-bold shadow-md">
            N
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--color-sidebar-text)]">
              Set up your organization
            </h1>
            <p className="mt-1 text-sm text-[var(--color-sidebar-text-muted)]">
              You'll be the owner. Invite your team once it's created.
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">✓</div>
            <span className="text-xs text-neutral-500">Account created</span>
          </div>
          <div className="h-px w-6 bg-neutral-300" />
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-xs font-bold">2</div>
            <span className="text-xs font-medium text-[var(--color-sidebar-text)]">Create org</span>
          </div>
          <div className="h-px w-6 bg-neutral-300" />
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 text-xs font-bold">3</div>
            <span className="text-xs text-neutral-400">Invite team</span>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-[var(--color-sidebar-border)] bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-neutral-100" />}>
            <OrgSetupForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
