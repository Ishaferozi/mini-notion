import { Suspense } from "react";
import { InviteAcceptClient } from "./InviteAcceptClient";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata = {
  title: "Accept invitation – Mini Notion",
};

export default function InvitePage({ params }: Props) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-[var(--color-sidebar-bg)] px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-xl font-bold shadow-md">
            N
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--color-sidebar-text)]">
              You've been invited
            </h1>
            <p className="mt-1 text-sm text-[var(--color-sidebar-text-muted)]">
              Accept the invitation to join your organization.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-sidebar-border)] bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-neutral-100" />}>
            <InviteAcceptClient params={params} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
