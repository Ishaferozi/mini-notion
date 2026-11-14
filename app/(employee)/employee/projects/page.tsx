import { Suspense } from "react";
import { connection } from "next/server";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { FolderOpen } from "lucide-react";
import type { TaskStatus } from "@/lib/types";

export const metadata = { title: "My Projects – Employee" };

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  on_hold:   "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  archived:  "bg-neutral-100 text-neutral-500",
};

async function ProjectsContent() {
  await connection();
  const ctx = await requireMember();
  const supabase = await createClient();

  const [{ data: projects }, { data: myTasks }] = await Promise.all([
    supabase.from("projects").select("*").eq("org_id", ctx.orgId).neq("status", "archived").order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status").eq("org_id", ctx.orgId).eq("assignee_id", ctx.userId),
  ]);

  // Per-project stats for my tasks
  const myTaskMap: Record<string, { total: number; completed: number }> = {};
  for (const t of myTasks ?? []) {
    if (!myTaskMap[t.project_id]) myTaskMap[t.project_id] = { total: 0, completed: 0 };
    myTaskMap[t.project_id].total++;
    if (t.status === "completed") myTaskMap[t.project_id].completed++;
  }

  const enriched = (projects ?? []).map((p) => ({
    ...p,
    myTotal: myTaskMap[p.id]?.total ?? 0,
    myCompleted: myTaskMap[p.id]?.completed ?? 0,
    myProgress: myTaskMap[p.id]?.total
      ? Math.round((myTaskMap[p.id].completed / myTaskMap[p.id].total) * 100)
      : 0,
  }));

  if (enriched.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-14 text-center">
        <FolderOpen className="mx-auto h-8 w-8 text-neutral-300 mb-3" />
        <p className="text-sm font-medium text-neutral-600">No projects available yet.</p>
        <p className="text-xs text-neutral-400 mt-1">Your admin will create projects and assign tasks to you.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {enriched.map((p) => (
        <div key={p.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-bold text-base uppercase">
                {p.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-neutral-800 truncate">{p.name}</h3>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE[p.status] ?? ""}`}>
              {p.status.replace("_", " ")}
            </span>
          </div>

          {p.description && (
            <p className="text-xs text-neutral-500 line-clamp-2">{p.description}</p>
          )}

          {/* My task progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-500">
                My tasks: {p.myCompleted}/{p.myTotal}
              </span>
              <span className="text-xs font-semibold text-neutral-700">{p.myProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                style={{ width: `${p.myProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              Created {new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
            {p.myTotal > 0 && (
              <span className="text-xs text-[var(--color-accent)] font-medium">
                {p.myTotal} task{p.myTotal !== 1 ? "s" : ""} assigned
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmployeeProjectsPage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="employee" breadcrumbs={[{ label: "Employee" }, { label: "My Projects" }]} /></Suspense>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Projects</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            All projects in your organization with your task progress.
          </p>
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-44 animate-pulse rounded-xl bg-neutral-100" />)}
          </div>
        }>
          <ProjectsContent />
        </Suspense>
      </div>
    </>
  );
}
