"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  FileText,
  BookOpen,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

const NAV = [
  {
    items: [
      { label: "My Dashboard", href: "/employee/dashboard",      icon: LayoutDashboard },
    ],
  },
  {
    section: "My Work",
    items: [
      { label: "My Tasks",    href: "/employee/tasks",           icon: CheckSquare },
      { label: "My Projects", href: "/employee/projects",        icon: FolderOpen },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "My Workspace", href: "/employee/pages",          icon: FileText },
      { label: "Documents",    href: "/employee/documents",      icon: BookOpen },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Notifications", href: "/employee/notifications", icon: Bell },
      { label: "My Profile",    href: "/employee/profile",       icon: User },
    ],
  },
];

interface EmployeeSidebarProps {
  orgName: string;
  userEmail: string;
  onSignOut: () => void;
}

export function EmployeeSidebar({ orgName, userEmail, onSignOut }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    return href === "/employee/dashboard"
      ? pathname === href
      : pathname.startsWith(href);
  }

  if (collapsed) {
    return (
      <aside
        className="flex h-full w-[60px] shrink-0 flex-col items-center border-r border-white/8 py-3 gap-1"
        style={{ background: "var(--sidebar-bg)" }}
        aria-label="Sidebar (collapsed)"
      >
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white font-bold text-sm">
          N
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/8 hover:text-white transition-colors"
          aria-label="Expand"
          style={{ background: "transparent" }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
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

  return (
    <aside
      className="flex h-full flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
      aria-label="Employee sidebar"
    >
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
            <p className="text-[10px]" style={{ color: "var(--sidebar-text-muted)" }}>Employee</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--sidebar-text-muted)" }}
          aria-label="Collapse"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

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

      <div
        className="shrink-0 border-t px-3 py-3 space-y-1"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <Avatar name={userEmail} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white/80">{userEmail.split("@")[0]}</p>
            <p className="text-[10px]" style={{ color: "var(--sidebar-text-muted)" }}>Employee</p>
          </div>
        </div>
        <button onClick={onSignOut} className="sidebar-link w-full text-red-400 hover:text-red-300">
          <LogOut className="icon h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
