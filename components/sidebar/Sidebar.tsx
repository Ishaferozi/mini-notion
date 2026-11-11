"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Page, PageNode } from "@/lib/types";
import { PageTree } from "./PageTree";
import { SearchBox } from "./SearchBox";
import { ArchivedPages } from "./ArchivedPages";

interface PageActionsCallbacks {
  onRename: (id: string) => void;
  onAddSubpage: (parentId: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

interface SidebarProps {
  pages: PageNode[];
  allPages: Page[];
  userEmail: string;
  renamingId: string | null;
  onRenameCommit: (id: string, title: string) => void;
  onCreatePage: () => void;
  onSignOut: () => void;
  pageActions: PageActionsCallbacks;
}

function NavItem({
  href,
  icon,
  label,
  onClick,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = href ? pathname === href : false;

  const cls = [
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
    isActive
      ? "bg-[var(--color-sidebar-active)] text-[var(--color-accent)]"
      : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)]",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={cls}>
        <span className="shrink-0">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls}>
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  );
}

export function Sidebar({
  pages,
  allPages,
  userEmail,
  renamingId,
  onRenameCommit,
  onCreatePage,
  onSignOut,
  pageActions,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  /* ── Collapsed rail ── */
  if (collapsed) {
    return (
      <aside
        className="flex h-full w-12 flex-col items-center border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)] py-3 gap-3"
        aria-label="Sidebar (collapsed)"
      >
        {/* Logo mark */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white font-bold text-sm">
          N
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="mt-2 flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-sidebar-hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
          aria-label="Expand sidebar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex h-full w-64 flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)]"
      aria-label="Sidebar"
    >
      {/* ── Logo + app name ── */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white font-bold text-sm shadow-sm">
            N
          </div>
          <span className="text-sm font-semibold text-[var(--color-sidebar-text)]">
            Mini Notion
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-sidebar-hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
          aria-label="Collapse sidebar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* ── User card — no dropdown, just display ── */}
      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm border border-[var(--color-sidebar-border)]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-xs font-bold uppercase">
          {userEmail.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-sidebar-text)]">
            {userEmail.split("@")[0]}
          </p>
          <p className="truncate text-xs text-[var(--color-sidebar-text-muted)]">
            {userEmail}
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-2 pb-2">
        <SearchBox pages={allPages} />
      </div>

      {/* ── Nav links ── */}
      <nav className="px-2 pb-2 space-y-0.5">
        <NavItem
          href="/"
          label="Home"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          }
        />
        <NavItem
          href="/workspace"
          label="My Workspace"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          }
        />
        <NavItem
          label="Trash"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          }
        />
      </nav>

      {/* ── Divider ── */}
      <div className="mx-3 border-t border-[var(--color-sidebar-border)]" />

      {/* ── My Pages ── */}
      <div className="flex flex-1 flex-col overflow-hidden pt-2">
        <div className="flex items-center justify-between px-4 py-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sidebar-text-muted)]">
            My Pages
          </span>
          <button
            onClick={onCreatePage}
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            aria-label="New page"
            title="New page"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          <PageTree
            pages={pages}
            renamingId={renamingId}
            onRenameCommit={onRenameCommit}
            onCreatePage={onCreatePage}
            actions={{
              onRename: pageActions.onRename,
              onAddSubpage: pageActions.onAddSubpage,
              onArchive: pageActions.onArchive,
              onDelete: pageActions.onDelete,
            }}
          />
        </nav>
      </div>

      {/* ── Archived pages ── */}
      <ArchivedPages
        pages={allPages}
        onRestore={pageActions.onRestore}
        onDelete={pageActions.onPermanentDelete}
      />

      {/* ── Footer ── */}
      <div className="border-t border-[var(--color-sidebar-border)] px-3 py-2.5">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
