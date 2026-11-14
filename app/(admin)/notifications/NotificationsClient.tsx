"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, { bg: string; text: string; label: string }> = {
  task_assigned:    { bg: "bg-violet-100", text: "text-violet-700", label: "T" },
  task_completed:   { bg: "bg-emerald-100", text: "text-emerald-700", label: "✓" },
  task_created:     { bg: "bg-blue-100", text: "text-blue-700", label: "+" },
  task_comment:     { bg: "bg-pink-100", text: "text-pink-700", label: "💬" },
  member_joined:    { bg: "bg-orange-100", text: "text-orange-700", label: "👤" },
  project_created:  { bg: "bg-blue-100", text: "text-blue-700", label: "📁" },
  invitation_sent:  { bg: "bg-amber-100", text: "text-amber-700", label: "✉" },
};

function getTypeStyle(type: string) {
  return TYPE_ICONS[type] ?? { bg: "bg-neutral-100", text: "text-neutral-600", label: type.charAt(0).toUpperCase() };
}

export function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [markingAll, setMarkingAll] = useState(false);

  const unread = notifications.filter((n) => !n.read_at).length;

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  }

  async function markAllRead() {
    setMarkingAll(true);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setMarkingAll(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {unread > 0 ? (
            <span className="font-semibold text-[var(--color-accent)]">{unread} unread</span>
          ) : (
            <span className="text-neutral-400">All caught up ✓</span>
          )}
        </p>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} loading={markingAll}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
              <Bell className="h-7 w-7 text-neutral-300" />
            </div>
            <p className="text-sm font-medium text-neutral-600">No notifications yet</p>
            <p className="text-xs text-neutral-400">Activity like task assignments will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {notifications.map((n) => {
              const style = getTypeStyle(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => { markRead(n.id); if (n.link) router.push(n.link); }}
                  className={[
                    "flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer",
                    !n.read_at ? "bg-violet-50/40 hover:bg-violet-50/70" : "hover:bg-neutral-50/60",
                  ].join(" ")}
                >
                  <div className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", style.bg, style.text].join(" ")}>
                    {style.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={["text-sm", !n.read_at ? "font-semibold text-neutral-800" : "text-neutral-700"].join(" ")}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-neutral-400">
                        {new Date(n.created_at).toLocaleString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {n.link && (
                        <span className="flex items-center gap-0.5 text-xs text-[var(--color-accent)]">
                          <ExternalLink className="h-3 w-3" /> View
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read_at && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
