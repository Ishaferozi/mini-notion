"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface Crumb {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  breadcrumbs?: Crumb[];
  userEmail: string;
  userRole: "admin" | "employee";
  onMobileMenuOpen?: () => void;
}

export function AppHeader({
  breadcrumbs = [],
  userEmail,
  userRole,
  onMobileMenuOpen,
}: AppHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const profileHref = userRole === "admin" ? "/profile" : "/employee/profile";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6 gap-4">
      {/* Left — hamburger (mobile) + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onMobileMenuOpen && (
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <span className="text-neutral-300 text-xs">/</span>}
                  {isLast || !crumb.href ? (
                    <span className={`truncate max-w-[200px] ${isLast ? "font-semibold text-neutral-800" : "text-neutral-500"}`}>
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate max-w-[160px] text-neutral-500 hover:text-neutral-800 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right — NotificationBell + avatar */}
      <div className="flex items-center gap-1 shrink-0">
        <NotificationBell userRole={userRole} />

        <Link
          href={profileHref}
          className="ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-full"
          aria-label="My profile"
        >
          <Avatar name={userEmail || "U"} size="sm" />
        </Link>
      </div>
    </header>
  );
}
