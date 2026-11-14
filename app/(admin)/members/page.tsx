import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MembersClient } from "./MembersClient";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export const metadata = { title: "Team Members – Admin" };

async function MembersContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id, role, joined_at")
    .eq("org_id", ctx.orgId)
    .order("joined_at", { ascending: true });

  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      return {
        ...m,
        email: data?.user?.email ?? "",
        display_name: (data?.user?.user_metadata?.full_name as string) ?? null,
        last_sign_in: data?.user?.last_sign_in_at ?? null,
      };
    })
  );

  return (
    <MembersClient
      members={enriched}
      currentUserId={ctx.userId}
    />
  );
}

export default function MembersPage() {
  return (
    <>      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Team Members</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Manage your organization's members, roles and access.
          </p>
        </div>
        <Suspense fallback={<TableSkeleton rows={5} cols={4} />}>
          <MembersContent />
        </Suspense>
      </div>
    </>
  );
}