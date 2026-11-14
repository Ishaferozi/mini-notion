import { Suspense } from "react";
import { connection } from "next/server";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmployeeTasksClient } from "./EmployeeTasksClient";

export const metadata = { title: "My Tasks – Employee" };

async function TasksContent() {
  await connection();
  const ctx = await requireMember();
  const supabase = await createClient();

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("org_id", ctx.orgId)
      .eq("assignee_id", ctx.userId)
      .order("due_date", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", ctx.orgId)
      .neq("status", "archived"),
  ]);

  return (
    <EmployeeTasksClient
      tasks={tasks ?? []}
      projects={projects ?? []}
      currentUserId={ctx.userId}
      orgId={ctx.orgId}
    />
  );
}

export default function EmployeeTasksPage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="employee" breadcrumbs={[{ label: "Employee" }, { label: "My Tasks" }]} /></Suspense>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Tasks</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Tasks assigned to you across all projects.
          </p>
        </div>
        <Suspense fallback={<TableSkeleton rows={6} cols={5} />}>
          <TasksContent />
        </Suspense>
      </div>
    </>
  );
}
