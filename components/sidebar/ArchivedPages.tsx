"use client";

import { useState } from "react";
import type { Page } from "@/lib/types";

interface ArchivedPagesProps {
  pages: Page[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ArchivedPages({ pages, onRestore, onDelete }: ArchivedPagesProps) {
  const [open, setOpen] = useState(false);
  const archived = pages.filter((p) => p.archived_at !== null);

  if (archived.length === 0) return null;

  return (
    <div className="border-t border-[var(--color-sidebar-border)] px-2 py-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs text-[var(--color-sidebar-text-muted)] hover:text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
      >
        <svg
          className={["h-3 w-3 transition-transform", open ? "rotate-90" : ""].join(" ")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span>Archived ({archived.length})</span>
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {archived.map((page) => (
            <li
              key={page.id}
              className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-[var(--color-sidebar-hover)] group"
            >
              {/* Page icon (muted) */}
              <svg
                className="h-3.5 w-3.5 shrink-0 text-[var(--color-sidebar-text-muted)]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>

              <span className="flex-1 truncate text-xs text-[var(--color-sidebar-text-muted)] line-through">
                {page.title || "Untitled"}
              </span>

              {/* Restore */}
              <button
                onClick={() => onRestore(page.id)}
                title="Restore"
                className="opacity-0 group-hover:opacity-100 flex h-4 w-4 items-center justify-center rounded text-green-600 hover:bg-green-50 transition-colors focus-visible:outline-none focus-visible:opacity-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>

              {/* Permanent delete */}
              <button
                onClick={() => onDelete(page.id)}
                title="Delete permanently"
                className="opacity-0 group-hover:opacity-100 flex h-4 w-4 items-center justify-center rounded text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:opacity-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
