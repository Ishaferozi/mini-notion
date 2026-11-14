"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotificationBellProps {
  userRole: "admin" | "employee";
}

export function NotificationBell({ userRole }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifPageHref = userRole === "admin" ? "/notifications" : "/employee/notifications";

  const unread = notifications.filter((n) => !n.read_at).length;

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const j = await res.json();
        setNotifications(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  // Open dropdown and load notifications
  async function handleToggle() {
    setOpen((v) => !v);
    if (!open) await fetchNotifications();
  }

  // Mark a single notification as read
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

  // Mark all as read
  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Auto-fetch on mount for unread count
  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <Bell style={{ width: 18, height: 18 }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-[9px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <span className="text-sm font-semibold text-neutral-800">
              Notifications
              {unread > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5">{unread}</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline font-medium">
                  <Check className="h-3 w-3" /> All read
                </button>
              )}
              <Link href={notifPageHref} onClick={() => setOpen(false)} className="text-xs text-neutral-500 hover:text-neutral-700">
                View all
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-[var(--color-accent)]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="h-6 w-6 text-neutral-200" />
                <p className="text-xs text-neutral-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={["flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group", !n.read_at ? "bg-violet-50/40 hover:bg-violet-50/70" : "hover:bg-neutral-50/60"].join(" ")}
                  onClick={() => { markRead(n.id); if (n.link) { router.push(n.link); setOpen(false); } }}
                >
                  <div className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", !n.read_at ? "bg-[var(--color-accent)] text-white" : "bg-neutral-200 text-neutral-500"].join(" ")}>
                    {n.type.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={["text-xs leading-snug", !n.read_at ? "font-semibold text-neutral-800" : "text-neutral-700"].join(" ")}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{n.body}</p>}
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {new Date(n.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.read_at && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
