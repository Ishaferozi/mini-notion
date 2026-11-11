"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PageNode } from "@/lib/types";
import { PageActions } from "./PageActions";

interface PageActionsCallbacks {
  onRename: (id: string) => void;
  onAddSubpage: (parentId: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

interface PageTreeItemProps {
  node: PageNode;
  depth: number;
  renamingId: string | null;
  onRenameCommit: (id: string, title: string) => void;
  actions: PageActionsCallbacks;
}

export function PageTreeItem({
  node,
  depth,
  renamingId,
  onRenameCommit,
  actions,
}: PageTreeItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/pages/${node.id}`;
  const hasChildren = node.children.length > 0;
  const isRenaming = renamingId === node.id;

  const [expanded, setExpanded] = useState(false);
  const [draftTitle, setDraftTitle] = useState(node.title || "Untitled");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-expand when a child is active
  useEffect(() => {
    if (node.children.some((c) => pathname?.startsWith(`/pages/${c.id}`))) {
      setExpanded(true);
    }
  }, [pathname, node.children]);

  // Focus the rename input when this node enters rename mode
  useEffect(() => {
    if (isRenaming) {
      setDraftTitle(node.title || "Untitled");
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isRenaming, node.title]);

  function commitRename() {
    const trimmed = draftTitle.trim() || "Untitled";
    onRenameCommit(node.id, trimmed);
  }

  return (
    <li>
      <div
        className={[
          "group flex items-center gap-0.5 rounded-md pr-1 transition-colors",
          isActive
            ? "bg-[var(--color-sidebar-active)]"
            : "hover:bg-[var(--color-sidebar-hover)]",
        ].join(" ")}
        style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors",
            "text-[var(--color-sidebar-text-muted)] hover:text-[var(--color-sidebar-text)]",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]",
            !hasChildren && "invisible",
          ].join(" ")}
          aria-label={expanded ? "Collapse" : "Expand"}
          tabIndex={hasChildren ? 0 : -1}
        >
          <svg
            className={["h-3 w-3 transition-transform", expanded ? "rotate-90" : ""].join(" ")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Page icon */}
        <svg
          className="h-4 w-4 shrink-0 text-[var(--color-sidebar-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>

        {/* Title — inline rename input or link */}
        {isRenaming ? (
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitRename(); }
              if (e.key === "Escape") { setDraftTitle(node.title || "Untitled"); onRenameCommit(node.id, node.title || "Untitled"); }
            }}
            maxLength={500}
            aria-label="Rename page"
            className={[
              "flex-1 min-w-0 bg-white rounded px-1 py-0.5 text-sm",
              "border border-[var(--color-accent)] outline-none",
              "text-[var(--color-sidebar-text)]",
            ].join(" ")}
          />
        ) : (
          <Link
            href={`/pages/${node.id}`}
            className={[
              "flex-1 truncate py-1 pl-1.5 text-sm transition-colors",
              isActive
                ? "text-[var(--color-sidebar-text)] font-medium"
                : "text-[var(--color-sidebar-text)] hover:text-neutral-900",
            ].join(" ")}
          >
            {node.title || "Untitled"}
          </Link>
        )}

        {/* Three-dot actions menu — visible on hover */}
        {!isRenaming && (
          <PageActions
            pageId={node.id}
            onRename={actions.onRename}
            onAddSubpage={actions.onAddSubpage}
            onArchive={actions.onArchive}
            onDelete={actions.onDelete}
          />
        )}
      </div>

      {/* Nested children */}
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <PageTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              renamingId={renamingId}
              onRenameCommit={onRenameCommit}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
