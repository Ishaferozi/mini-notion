import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { TableSkeleton, CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { CheckSquare, TrendingUp, Clock, AlertCircle, CalendarClock, Layers } from "lucide-react";
import type { TaskStatus } from "@/lib/types";

export const metadata = { title: "My Dashboard – Employee" };

async function DashboardContent() {
  await connection();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organization_members")
    .select("role, org_id, organizations(name)")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/org-setup");

  const orgId = member.org_id;
  const org = Array.isArray(member.organizations) ? member.organizations[0] : member.organizations;
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    { data: myOpenTasks },
    { count: totalAssigned },
    { count: completedCount },
    { count: inProgressCount },
    { count: todoCount },
    { count: overdueCount },
    { data: upcomingTasks },
    { data: projects },
    { data: recentUpdates },
  ] = await Promise.all([
    supabase.from("tasks").select("id, title, status, priority, due_date, project_id")
      .eq("org_id", orgId).eq("assignee_id", user.id)
      .neq("status", "completed").order("due_date", { ascending: true }).limit(5),
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("assignee_id", user.id),
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("assignee_id", user.id).eq("status", "completed"),
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("assignee_id", user.id).eq("status", "in_progress"),
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("assignee_id", user.id).eq("status", "todo"),
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("assignee_id", user.id)
      .neq("status", "completed").lt("due_date", today),
    // Upcoming deadlines — next 7 days
    supabase.from("tasks").select("id, title, priority, due_date")
      .eq("org_id", orgId).eq("assignee_id", user.id)
      .neq("status", "completed")
      .gte("due_date", today).lte("due_date", nextWeek)
      .order("due_date", { ascending: true }).limit(5),
    supabase.from("projects").select("id, name, status")
      .eq("org_id", orgId).eq("status", "active").limit(6),
    // Recent task updates on my tasks
    supabase.from("tasks").select("id, title, status, updated_at")
      .eq("org_id", orgId).eq("assignee_id", user.id)
      .order("updated_at", { ascending: false }).limit(5),
  ]);

  const name = user.email?.split("@")[0] ?? "there";

  return (
    <>
      <AppHeader
        userEmail={user.email ?? ""}
        userRole="employee"
        breadcrumbs={[{ label: org?.name ?? "" }, { label: "My Dashboard" }]}
      />
      <div className="flex flex-col gap-7 p-6 md:p-8">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Welcome back, {name} 👋</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Here&apos;s a summary of your work in <strong>{org?.name}</strong>.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <DashboardCard label="Total Tasks" value={totalAssigned ?? 0} icon={CheckSquare} iconColor="bg-violet-500" />
          <DashboardCard label="To Do" value={todoCount ?? 0} icon={Layers} iconColor="bg-neutral-500" />
          <DashboardCard label="In Progress" value={inProgressCount ?? 0} icon={Clock} iconColor="bg-blue-500" />
          <DashboardCard label="Completed" value={completedCount ?? 0} icon={TrendingUp} iconColor="bg-emerald-500" />
          <DashboardCard
            label="Overdue"
            value={overdueCount ?? 0}
            icon={AlertCircle}
            iconColor={overdueCount ? "bg-red-500" : "bg-neutral-400"}
          />
        </div>

        {/* Two-col: open tasks + upcoming deadlines */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* My open tasks */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">My Open Tasks</h2>
              <Link href="/employee/tasks" className="text-xs text-[var(--color-accent)] hover:underline font-medium">
                View all →
              </Link>
            </div>
            {!myOpenTasks || myOpenTasks.length === 0 ? (
              <p className="px-5 py-10 text-sm text-neutral-400 text-center">All caught up! 🎉</p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {myOpenTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <StatusBadge status={t.status as TaskStatus} />
                    <span className="flex-1 truncate text-sm text-neutral-700">{t.title}</span>
                    <PriorityBadge priority={t.priority as never} />
                    {t.due_date && (
                      <span className={`shrink-0 text-xs ${new Date(t.due_date) < new Date() ? "text-red-500 font-medium" : "text-neutral-400"}`}>
                        {new Date(t.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming deadlines */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-neutral-100">
              <CalendarClock className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-neutral-800">Upcoming Deadlines (7 days)</h2>
            </div>
            {!upcomingTasks || upcomingTasks.length === 0 ? (
              <p className="px-5 py-10 text-sm text-neutral-400 text-center">No deadlines this week 🗓️</p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {upcomingTasks.map((t) => {
                  const daysLeft = Math.ceil(
                    (new Date(t.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <PriorityBadge priority={t.priority as never} />
                      <span className="flex-1 truncate text-sm text-neutral-700">{t.title}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        daysLeft <= 1 ? "bg-red-100 text-red-700" : daysLeft <= 3 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Two-col: projects + recent updates */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* My projects */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">My Projects</h2>
              <Link href="/employee/projects" className="text-xs text-[var(--color-accent)] hover:underline font-medium">
                View all →
              </Link>
            </div>
            {!projects || projects.length === 0 ? (
              <p className="px-5 py-10 text-sm text-neutral-400 text-center">No active projects.</p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 text-xs font-bold uppercase">
                      {p.name.charAt(0)}
                    </div>
                    <span className="flex-1 truncate text-sm font-medium text-neutral-700">{p.name}</span>
                    <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent task updates */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">Recent Updates</h2>
            </div>
            {!recentUpdates || recentUpdates.length === 0 ? (
              <p className="px-5 py-10 text-sm text-neutral-400 text-center">No recent updates.</p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recentUpdates.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <StatusBadge status={t.status as TaskStatus} />
                    <span className="flex-1 truncate text-sm text-neutral-700">{t.title}</span>
                    <span className="text-xs text-neutral-400 shrink-0">
                      {new Date(t.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 p-6 md:p-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[1,2,3,4,5].map(i => <CardSkeleton key={i} />)}
          </div>
          <TableSkeleton rows={5} cols={3} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
