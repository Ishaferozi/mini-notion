"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, ChevronRight, Search, Globe, Lock } from "lucide-react";
import type { Page, PageNode } from "@/lib/types";
import { Button } from "@/components/ui/Button";

function PageRow({ node, depth = 0 }: { node: PageNode; depth?: number }) {
  return (
    <>
      <Link
        href={`/pages/${node.id}`}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors group"
        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
      >
        <span className="text-lg shrink-0">{node.icon ?? "📄"}</span>
        <span className="flex-1 text-sm font-medium text-neutral-800 truncate">{node.title || "Untitled"}</span>
        <span className="text-xs text-neutral-400 shrink-0 hidden group-hover:block">
          {new Date(node.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 shrink-0" />
      </Link>
      {node.children.map((child) => (
        <PageRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function WorkspaceClient({
  pages, allPages, orgPages, orgId,
}: {
  pages: PageNode[];
  allPages: Page[];
  orgPages: Page[];
  orgId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const all = [...allPages, ...orgPages];
    return all.filter(
      (p) => !p.archived_at && p.title.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8);
  }, [allPages, orgPages, search]);

  async function handleCreate(visibility: "personal" | "org") {
    if (visibility === "personal") setCreating(true);
    else setCreatingOrg(true);

    const body: Record<string, unknown> = { title: "Untitled", parent_id: null };
    if (visibility === "org") {
      body.visibility = "org";
      body.org_id = orgId;
    }

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setCreating(false);
    setCreatingOrg(false);

    if (res.ok) {
      const { data } = await res.json();
      router.push(`/pages/${data.id}`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all pages…"
          className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      {/* Search results */}
      {search.trim() && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-2.5 border-b border-neutral-100 bg-neutral-50">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Results ({searchResults.length})</p>
          </div>
          {searchResults.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-400 text-center">No pages match &ldquo;{search}&rdquo;</p>
          ) : (
            <div className="p-2">
              {searchResults.map((p) => (
                <Link key={p.id} href={`/pages/${p.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors">
                  <span className="text-lg">{p.icon ?? "📄"}</span>
                  <span className="flex-1 text-sm font-medium text-neutral-800 truncate">{p.title || "Untitled"}</span>
                  {p.visibility === "org" ? <Globe className="h-3.5 w-3.5 text-neutral-400 shrink-0" /> : <Lock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!search.trim() && (
        <>
          {/* Personal pages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Personal Pages
              </h2>
              <Button variant="ghost" size="sm" onClick={() => handleCreate("personal")} loading={creating}>
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              {pages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <FileText className="h-6 w-6 text-neutral-300" />
                  <p className="text-sm text-neutral-500">No personal pages yet.</p>
                </div>
              ) : (
                <div className="p-2">{pages.map((n) => <PageRow key={n.id} node={n} />)}</div>
              )}
            </div>
          </div>

          {/* Org pages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Organization Pages
              </h2>
              <Button variant="ghost" size="sm" onClick={() => handleCreate("org")} loading={creatingOrg}>
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              {orgPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Globe className="h-6 w-6 text-neutral-300" />
                  <p className="text-sm text-neutral-500">No org pages yet. Create one to share with your team.</p>
                </div>
              ) : (
                <div className="p-2">
                  {orgPages.map((p) => (
                    <Link key={p.id} href={`/pages/${p.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors group">
                      <span className="text-lg">{p.icon ?? "📄"}</span>
                      <span className="flex-1 text-sm font-medium text-neutral-800 truncate">{p.title || "Untitled"}</span>
                      <span className="text-xs text-neutral-400 shrink-0">
                        {new Date(p.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
