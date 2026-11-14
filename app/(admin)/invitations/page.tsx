import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InvitationsClient } from "./InvitationsClient";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export const metadata = { title: "Invitations – Admin" };

async function InvitationsContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false });

  return <InvitationsClient invitations={invitations ?? []} />;
}

export default function InvitationsPage() {
  return (
    <>      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Invitations</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Invite new members to join your organization.
          </p>
        </div>
        <Suspense fallback={<TableSkeleton rows={4} cols={4} />}>
          <InvitationsContent />
        </Suspense>
      </div>
    </>
  );
}