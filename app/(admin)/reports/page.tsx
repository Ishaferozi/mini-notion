import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { TableSkeleton, CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { CheckSquare, AlertCircle, Clock, TrendingUp, Users, FolderOpen } from "lucide-react";
import type { TaskStatus, TaskPriority } from "@/lib/types";

export const metadata = { title: "Reports – Admin" };

async function ReportsContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalTasks },
    { count: completedTasks },
    { count: inProgressTasks },
    { count: todoTasks },
    { count: overdueTasks },
    { count: urgentTasks },
    { count: totalMembers },
    { count: totalProjects },
    { data: projects },
    { data: members },
    { data: tasksByProject },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "completed" as TaskStatus),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "in_progress" as TaskStatus),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "todo" as TaskStatus),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId).neq("status", "completed").lt("due_date", today),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("priority", "urgent" as TaskPriority),
    supabase.from("organization_members").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId),
    supabase.from("projects").select("id, name, status").eq("org_id", ctx.orgId).neq("status", "archived"),
    supabase.from("organization_members").select("id, user_id, role").eq("org_id", ctx.orgId),
    supabase.from("tasks").select("project_id, status, assignee_id").eq("org_id", ctx.orgId),
  ]);

  // Per-project stats
  const projectStats = (projects ?? []).map((p) => {
    const ptasks = (tasksByProject ?? []).filter((t) => t.project_id === p.id);
    const done = ptasks.filter((t) => t.status === "completed").length;
    const progress = ptasks.length ? Math.round((done / ptasks.length) * 100) : 0;
    return { ...p, total: ptasks.length, completed: done, progress };
  }).sort((a, b) => b.total - a.total);

  // Per-member workload
  const memberWorkload = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: user } = await admin.auth.admin.getUserById(m.user_id);
      const myTasks = (tasksByProject ?? []).filter((t) => t.assignee_id === m.user_id);
      const done = myTasks.filter((t) => t.status === "completed").length;
      return {
        email: user?.user?.email ?? m.user_id,
        total: myTasks.length,
        completed: done,
        pending: myTasks.filter((t) => t.status !== "completed").length,
      };
    })
  );

  const completionRate = totalTasks ? Math.round(((completedTasks ?? 0) / totalTasks) * 100) : 0;

  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="admin" breadcrumbs={[{ label: "Admin" }, { label: "Reports" }]} /></Suspense>
      <div className="flex flex-col gap-8 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Reports & Analytics</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Real-time overview of your organization&apos;s performance.</p>
        </div>

        {/* Overview cards */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4">Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard label="Total Tasks" value={totalTasks ?? 0} icon={CheckSquare} iconColor="bg-violet-500" />
            <DashboardCard label="Completed" value={completedTasks ?? 0} sub={`${completionRate}% completion rate`} icon={TrendingUp} iconColor="bg-emerald-500" />
            <DashboardCard label="In Progress" value={inProgressTasks ?? 0} icon={Clock} iconColor="bg-blue-500" />
            <DashboardCard label="Overdue" value={overdueTasks ?? 0} icon={AlertCircle} iconColor={overdueTasks ? "bg-red-500" : "bg-neutral-400"} />
          </div>
        </div>

        {/* Task breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4">Task Breakdown</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard label="To Do" value={todoTasks ?? 0} icon={CheckSquare} iconColor="bg-neutral-400" />
            <DashboardCard label="Urgent Tasks" value={urgentTasks ?? 0} icon={AlertCircle} iconColor="bg-red-500" />
            <DashboardCard label="Team Members" value={totalMembers ?? 0} icon={Users} iconColor="bg-violet-500" />
            <DashboardCard label="Projects" value={totalProjects ?? 0} icon={FolderOpen} iconColor="bg-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Project progress */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-sm font-semibold text-neutral-700">Project Progress</h2>
            </div>
            {projectStats.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400 text-center">No projects yet.</p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {projectStats.map((p) => (
                  <div key={p.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-800 truncate max-w-[180px]">{p.name}</span>
                      <span className="text-xs font-semibold text-neutral-600 ml-2 shrink-0">{p.progress}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-neutral-400 shrink-0">{p.completed}/{p.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member workload */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-sm font-semibold text-neutral-700">Employee Workload</h2>
            </div>
            {memberWorkload.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400 text-center">No members yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Member</th>
                    <th className="px-5 py-2.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-2.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Done</th>
                    <th className="px-5 py-2.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {memberWorkload.map((m, i) => (
                    <tr key={i} className="hover:bg-neutral-50/60">
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-neutral-800 truncate max-w-[160px] block">{m.email.split("@")[0]}</span>
                        <span className="text-xs text-neutral-400">{m.email}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm font-semibold text-neutral-800">{m.total}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-semibold">{m.completed}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">{m.pending}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
