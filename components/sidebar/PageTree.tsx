"use client";

import type { PageNode } from "@/lib/types";
import { PageTreeItem } from "./PageTreeItem";

interface PageActionsCallbacks {
  onRename: (id: string) => void;
  onAddSubpage: (parentId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

interface PageTreeProps {
  pages: PageNode[];
  renamingId: string | null;
  onRenameCommit: (id: string, title: string) => void;
  onCreatePage?: () => void;
  actions: PageActionsCallbacks;
}

export function PageTree({
  pages,
  renamingId,
  onRenameCommit,
  onCreatePage,
  actions,
}: PageTreeProps) {
  if (pages.length === 0) {
    return (
      <div className="px-2 py-4">
        <p className="text-xs text-[var(--color-sidebar-text-muted)] px-2">
          No pages yet.{" "}
          {onCreatePage && (
            <button
              onClick={onCreatePage}
              className="underline hover:text-[var(--color-sidebar-text)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] rounded"
            >
              Create one
            </button>
          )}
        </p>
      </div>
    );
  }

  return (
    <ul role="tree" aria-label="Pages">
      {pages.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          depth={0}
          renamingId={renamingId}
          onRenameCommit={onRenameCommit}
          actions={actions}
        />
      ))}
    </ul>
  );
}
