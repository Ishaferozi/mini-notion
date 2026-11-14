"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./Sidebar";
import type { Page, PageNode } from "@/lib/types";

interface SidebarClientProps {
  pages: PageNode[];
  allPages: Page[];
  userEmail: string;
}

export function SidebarClient({ pages, allPages, userEmail }: SidebarClientProps) {
  const router = useRouter();
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // ── Sign out ────────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  // ── Create page (root or subpage) ───────────────────────────────────────────
  const handleCreatePage = useCallback(
    async (parentId: string | null = null) => {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", parent_id: parentId }),
      });

      if (res.ok) {
        const { data } = await res.json();
        // Enter rename mode immediately so the user can name the new page
        setRenamingId(data.id);
        router.push(`/pages/${data.id}`);
        router.refresh();
      }
    },
    [router]
  );

  // ── Rename: start (set renamingId) ──────────────────────────────────────────
  const handleRename = useCallback((id: string) => {
    setRenamingId(id);
  }, []);

  // ── Rename: commit (send PATCH, clear renamingId) ───────────────────────────
  const handleRenameCommit = useCallback(
    async (id: string, title: string) => {
      setRenamingId(null);
      const res = await fetch(`/api/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) router.refresh();
    },
    [router]
  );

  // ── Add subpage ─────────────────────────────────────────────────────────────
  const handleAddSubpage = useCallback(
    async (parentId: string) => {
      await handleCreatePage(parentId);
    },
    [handleCreatePage]
  );

  // ── Archive (soft-delete) ───────────────────────────────────────────────────
  const handleArchive = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived_at: new Date().toISOString() }),
      });

      if (res.ok) {
        // If we're currently viewing the archived page, navigate away
        if (typeof window !== "undefined" && window.location.pathname === `/pages/${id}`) {
          router.push("/");
        }
        router.refresh();
      }
    },
    [router]
  );

  // ── Restore from archive ────────────────────────────────────────────────────
  const handleRestore = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived_at: null }),
      });
      if (res.ok) router.refresh();
    },
    [router]
  );

  // ── Permanent delete ────────────────────────────────────────────────────────
  const handlePermanentDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "Permanently delete this page? This cannot be undone."
      );
      if (!confirmed) return;

      const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });

      if (res.ok || res.status === 204) {
        if (typeof window !== "undefined" && window.location.pathname === `/pages/${id}`) {
          router.push("/");
        }
        router.refresh();
      }
    },
    [router]
  );

  // ── Delete active (from tree — archives first, then user can hard-delete) ───
  // Clicking "Delete" in the context menu on an active page archives it.
  // Permanent deletion is only available from the Archived section.
  const handleDelete = useCallback(
    async (id: string) => {
      await handleArchive(id);
    },
    [handleArchive]
  );

  // ── Move page up/down (reorder among siblings) ─────────────────────────────
  const handleMoveUp = useCallback(
    async (id: string) => {
      const page = allPages.find((p) => p.id === id);
      if (!page) return;
      const siblings = allPages
        .filter((p) => p.parent_id === page.parent_id && !p.archived_at)
        .sort((a, b) => a.position - b.position);
      const idx = siblings.findIndex((p) => p.id === id);
      if (idx <= 0) return;
      const prev = siblings[idx - 1];
      // Swap positions
      await Promise.all([
        fetch(`/api/pages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: prev.position }) }),
        fetch(`/api/pages/${prev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: page.position }) }),
      ]);
      router.refresh();
    },
    [allPages, router]
  );

  const handleMoveDown = useCallback(
    async (id: string) => {
      const page = allPages.find((p) => p.id === id);
      if (!page) return;
      const siblings = allPages
        .filter((p) => p.parent_id === page.parent_id && !p.archived_at)
        .sort((a, b) => a.position - b.position);
      const idx = siblings.findIndex((p) => p.id === id);
      if (idx >= siblings.length - 1) return;
      const next = siblings[idx + 1];
      await Promise.all([
        fetch(`/api/pages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: next.position }) }),
        fetch(`/api/pages/${next.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: page.position }) }),
      ]);
      router.refresh();
    },
    [allPages, router]
  );

  return (
    <Sidebar
      pages={pages}
      allPages={allPages}
      userEmail={userEmail}
      renamingId={renamingId}
      onRenameCommit={handleRenameCommit}
      onCreatePage={() => handleCreatePage(null)}
      onSignOut={handleSignOut}
      pageActions={{
        onRename: handleRename,
        onAddSubpage: handleAddSubpage,
        onMoveUp: handleMoveUp,
        onMoveDown: handleMoveDown,
        onArchive: handleArchive,
        onDelete: handleDelete,
        onRestore: handleRestore,
        onPermanentDelete: handlePermanentDelete,
      }}
    />
  );
}
