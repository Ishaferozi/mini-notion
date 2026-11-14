"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Mail,
  FolderOpen,
  CheckSquare,
  FileText,
  BookOpen,
  BarChart2,
  Clock,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  section?: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard",          href: "/dashboard",    icon: LayoutDashboard },
    ],
  },
  {
    section: "Team",
    items: [
      { label: "Team Members",       href: "/members",      icon: Users },
      { label: "Invitations",        href: "/invitations",  icon: Mail },
    ],
  },
  {
    section: "Work",
    items: [
      { label: "Projects",           href: "/projects",     icon: FolderOpen },
      { label: "All Tasks",          href: "/tasks",        icon: CheckSquare },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Workspace",          href: "/workspace",    icon: FileText },
      { label: "Documents",          href: "/documents",    icon: BookOpen },
    ],
  },
  {
    section: "Insights",
    items: [
      { label: "Reports",            href: "/reports",      icon: BarChart2 },
      { label: "Activity Logs",      href: "/activity",     icon: Clock },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Notifications",      href: "/notifications",    icon: Bell },
      { label: "Org Settings",       href: "/settings",         icon: Settings },
      { label: "My Profile",         href: "/profile",          icon: User },
    ],
  },
];

interface AdminSidebarProps {
  orgName: string;
  orgSlug: string;
  userEmail: string;
  userRole: string;
  onSignOut: () => void;
}

export function AdminSidebar({
  orgName,
  orgSlug,
  userEmail,
  userRole,
  onSignOut,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);
  }

  /* ── Collapsed rail ─────────────────────────────────────────────────── */
  if (collapsed) {
    return (
      <aside
        className="flex h-full w-[60px] shrink-0 flex-col items-center border-r border-white/8 py-3 gap-1"
        style={{ background: "var(--sidebar-bg)" }}
        aria-label="Sidebar (collapsed)"
      >
        {/* Logo */}
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white font-bold text-sm">
          N
        </div>

        {/* Expand */}
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/8 hover:text-white transition-colors"
          aria-label="Expand sidebar"
          style={{ background: "transparent" }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Nav icons */}
        <nav className="mt-2 flex flex-col gap-1 items-center w-full px-2 flex-1 overflow-y-auto">
          {NAV.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  active
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-white/50 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  /* ── Full sidebar ───────────────────────────────────────────────────── */
  return (
    <aside
      className="flex h-full flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
      aria-label="Admin sidebar"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b shrink-0"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white leading-tight">{orgName}</p>
            <p className="truncate text-[10px]" style={{ color: "var(--sidebar-text-muted)" }}>Admin</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--sidebar-text-muted)" }}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <p
                className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--sidebar-text-muted)" }}
              >
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={["sidebar-link", active ? "active" : ""].join(" ")}
                    >
                      <Icon className="icon h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="shrink-0 border-t px-3 py-3 space-y-1"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <Avatar name={userEmail} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white/80">{userEmail.split("@")[0]}</p>
            <p className="text-[10px] capitalize" style={{ color: "var(--sidebar-text-muted)" }}>
              {userRole}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="sidebar-link w-full text-red-400 hover:text-red-300"
        >
          <LogOut className="icon h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
