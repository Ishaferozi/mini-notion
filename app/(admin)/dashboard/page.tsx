import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { AppHeader } from "@/components/layout/AppHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { Users, FolderOpen, CheckSquare, TrendingUp } from "lucide-react";
import type { TaskStatus } from "@/lib/types";

export const metadata = { title: "Dashboard – Admin" };

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
  if (member.role === "employee") redirect("/employee/dashboard");

  const orgId = member.org_id;
  const org = Array.isArray(member.organizations) ? member.organizations[0] : member.organizations;

  const [
    { count: totalMembers },
    { count: totalProjects },
    { count: totalTasks },
    { count: completedTasks },
    { count: pendingInvites },
    { data: recentTasks },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("organization_members").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "completed" as TaskStatus),
    supabase.from("invitations").select("*", { count: "exact", head: true }).eq("org_id", orgId).is("accepted_at", null).gt("expires_at", new Date().toISOString()),
    supabase.from("tasks").select("id, title, status, priority, due_date").eq("org_id", orgId).order("created_at", { ascending: false }).limit(6),
    supabase.from("activity_logs").select("id, action, entity_type, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(6),
  ]);

  const completionRate = totalTasks ? Math.round(((completedTasks ?? 0) / totalTasks) * 100) : 0;

  return (
    <>      <AppHeader
        userEmail={user.email ?? ""}
        userRole="admin"
        breadcrumbs={[{ label: org?.name ?? "Dashboard" }, { label: "Dashboard" }]}
      />

      <div className="flex flex-col gap-6 p-6 md:p-8">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Welcome back 👋</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Here&apos;s what&apos;s happening in <strong>{org?.name}</strong> today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            label="Team Members"
            value={totalMembers ?? 0}
            sub={`${pendingInvites ?? 0} pending invite${pendingInvites !== 1 ? "s" : ""}`}
            icon={Users}
            iconColor="bg-violet-500"
          />
          <DashboardCard
            label="Active Projects"
            value={totalProjects ?? 0}
            icon={FolderOpen}
            iconColor="bg-blue-500"
          />
          <DashboardCard
            label="Total Tasks"
            value={totalTasks ?? 0}
            sub={`${completedTasks ?? 0} completed`}
            icon={CheckSquare}
            iconColor="bg-emerald-500"
          />
          <DashboardCard
            label="Completion Rate"
            value={`${completionRate}%`}
            sub={`${completedTasks ?? 0} of ${totalTasks ?? 0} done`}
            icon={TrendingUp}
            iconColor="bg-amber-500"
          />
        </div>

        {/* Two-col panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Tasks */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">Recent Tasks</h2>
              <Link href="/tasks" className="text-xs text-[var(--color-accent)] hover:underline font-medium">
                View all →
              </Link>
            </div>
            {!recentTasks || recentTasks.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400 text-center">No tasks yet.</p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recentTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <StatusBadge status={t.status as TaskStatus} />
                    <span className="flex-1 truncate text-sm text-neutral-700">{t.title}</span>
                    <PriorityBadge priority={t.priority as never} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">Activity</h2>
              <Link href="/activity" className="text-xs text-[var(--color-accent)] hover:underline font-medium">
                View all →
              </Link>
            </div>
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400 text-center">No activity yet.</p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 text-xs font-bold uppercase">
                      {log.entity_type.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-700 truncate">
                        <span className="font-medium capitalize">{log.entity_type}</span>{" "}
                        {log.action}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(log.created_at).toLocaleString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
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

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-100" />)}
          </div>
          <TableSkeleton rows={5} cols={3} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
