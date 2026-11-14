import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TasksClient } from "./TasksClient";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export const metadata = { title: "All Tasks – Admin" };

async function TasksContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [{ data: tasks }, { data: projects }, { data: members }] = await Promise.all([
    supabase.from("tasks").select("*").eq("org_id", ctx.orgId).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").eq("org_id", ctx.orgId).neq("status", "archived"),
    supabase.from("organization_members").select("id, user_id, role").eq("org_id", ctx.orgId),
  ]);

  // Enrich members with emails
  const enrichedMembers = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data } = await adminClient.auth.admin.getUserById(m.user_id);
      return { ...m, email: data?.user?.email ?? m.user_id };
    })
  );

  return (
    <TasksClient
      tasks={tasks ?? []}
      projects={projects ?? []}
      members={enrichedMembers}
      currentUserId={ctx.userId}
    />
  );
}

export default function TasksPage() {
  return (
    <>      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">All Tasks</h1>
          <p className="mt-0.5 text-sm text-neutral-500">View, create and manage all tasks across projects.</p>
        </div>
        <Suspense fallback={<TableSkeleton rows={6} cols={5} />}>
          <TasksContent />
        </Suspense>
      </div>
    </>
  );
}