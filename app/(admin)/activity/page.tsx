import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { Clock, Filter } from "lucide-react";
import type { ActivityEntityType } from "@/lib/types";

export const metadata = { title: "Activity Logs – Admin" };

const ENTITY_STYLES: Record<string, { bg: string; text: string }> = {
  organization: { bg: "bg-violet-100", text: "text-violet-700" },
  project:      { bg: "bg-blue-100",   text: "text-blue-700" },
  task:         { bg: "bg-emerald-100", text: "text-emerald-700" },
  member:       { bg: "bg-orange-100",  text: "text-orange-700" },
  invitation:   { bg: "bg-amber-100",   text: "text-amber-700" },
  page:         { bg: "bg-neutral-100", text: "text-neutral-600" },
  comment:      { bg: "bg-pink-100",    text: "text-pink-700" },
};

const ACTION_LABELS: Record<string, string> = {
  created:                   "Created",
  updated:                   "Updated",
  deleted:                   "Deleted",
  joined:                    "Joined organization",
  role_changed:              "Role changed",
  status_changed_to_todo:    "→ To Do",
  status_changed_to_in_progress: "→ In Progress",
  status_changed_to_completed: "→ Completed",
};

async function ActivityContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  // Enrich with actor emails
  const userIds = [...new Set((logs ?? []).filter((l) => l.user_id).map((l) => l.user_id as string))];
  const emailMap: Record<string, string> = {};
  await Promise.all(
    userIds.map(async (uid) => {
      const { data } = await adminClient.auth.admin.getUserById(uid);
      if (data?.user?.email) emailMap[uid] = data.user.email;
    })
  );

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm flex flex-col items-center justify-center py-20 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
          <Clock className="h-6 w-6 text-neutral-400" />
        </div>
        <p className="text-sm font-medium text-neutral-600">No activity logged yet.</p>
        <p className="text-xs text-neutral-400">Actions like creating tasks and projects will appear here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {logs.length} events
        </span>
      </div>
      <div className="divide-y divide-neutral-50">
        {logs.map((log) => {
          const style = ENTITY_STYLES[log.entity_type] ?? { bg: "bg-neutral-100", text: "text-neutral-600" };
          const actorEmail = log.user_id ? (emailMap[log.user_id] ?? "Unknown") : "System";
          const actionLabel = ACTION_LABELS[log.action] ?? log.action;
          const meta = (log.metadata ?? {}) as Record<string, string | null>;

          return (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-neutral-50/60 transition-colors">
              {/* Entity badge */}
              <span className={["shrink-0 mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", style.bg, style.text].join(" ")}>
                {log.entity_type}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-neutral-800">{actorEmail.split("@")[0]}</span>
                  <span className="text-sm text-neutral-600">{actionLabel}</span>
                  {meta?.title && (
                    <span className="text-sm text-neutral-500 truncate max-w-[200px]">&ldquo;{String(meta.title)}&rdquo;</span>
                  )}
                  {meta?.name && (
                    <span className="text-sm text-neutral-500 truncate max-w-[200px]">&ldquo;{String(meta.name)}&rdquo;</span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(log.created_at).toLocaleString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <>      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Activity Logs</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Audit trail of all actions in your organization.
          </p>
        </div>
        <Suspense fallback={<TableSkeleton rows={6} cols={2} />}>
          <ActivityContent />
        </Suspense>
      </div>
    </>
  );
}