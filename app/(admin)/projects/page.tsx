import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectsClient } from "./ProjectsClient";

export const metadata = { title: "Projects – Admin" };

async function ProjectsContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [{ data: projects }, { data: taskCounts }, { data: projectMembers }, { data: orgMembers }] = await Promise.all([
    supabase.from("projects").select("*").eq("org_id", ctx.orgId).order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status").eq("org_id", ctx.orgId),
    supabase.from("project_members").select("project_id, user_id").eq("org_id", ctx.orgId),
    supabase.from("organization_members").select("id, user_id, role").eq("org_id", ctx.orgId),
  ]);

  const countMap: Record<string, { total: number; completed: number }> = {};
  for (const t of taskCounts ?? []) {
    if (!countMap[t.project_id]) countMap[t.project_id] = { total: 0, completed: 0 };
    countMap[t.project_id].total++;
    if (t.status === "completed") countMap[t.project_id].completed++;
  }

  const memberIdsMap: Record<string, string[]> = {};
  for (const pm of projectMembers ?? []) {
    if (!memberIdsMap[pm.project_id]) memberIdsMap[pm.project_id] = [];
    memberIdsMap[pm.project_id].push(pm.user_id);
  }

  const enrichedProjects = (projects ?? []).map((p) => ({
    ...p,
    task_total: countMap[p.id]?.total ?? 0,
    task_completed: countMap[p.id]?.completed ?? 0,
    memberIds: memberIdsMap[p.id] ?? [],
  }));

  const enrichedMembers = await Promise.all(
    (orgMembers ?? []).map(async (m) => {
      const { data } = await adminClient.auth.admin.getUserById(m.user_id);
      return { id: m.id, user_id: m.user_id, email: data?.user?.email ?? m.user_id, display_name: (data?.user?.user_metadata?.full_name as string) ?? null };
    })
  );

  return <ProjectsClient projects={enrichedProjects} members={enrichedMembers} orgId={ctx.orgId} />;
}

export default function ProjectsPage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="admin" breadcrumbs={[{ label: "Admin" }, { label: "Projects" }]} /></Suspense>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Projects</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Create and manage organization projects with team assignments.</p>
        </div>
        <Suspense fallback={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-44 animate-pulse rounded-xl bg-neutral-100"/>)}</div>}>
          <ProjectsContent />
        </Suspense>
      </div>
    </>
  );
}
