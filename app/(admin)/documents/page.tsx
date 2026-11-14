import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { BookOpen, Plus, FileText } from "lucide-react";
import type { Page } from "@/lib/types";

export const metadata = { title: "Documents – Admin" };

async function DocumentsContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();

  // Show all org-visible pages (visibility = 'org') plus user's personal pages
  const { data: orgPages } = await supabase
    .from("pages")
    .select("id, title, icon, cover, updated_at, user_id, visibility, parent_id")
    .eq("org_id", ctx.orgId)
    .eq("visibility", "org")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  const { data: personalPages } = await supabase
    .from("pages")
    .select("id, title, icon, cover, updated_at, user_id, visibility, parent_id")
    .eq("user_id", ctx.userId)
    .eq("visibility", "personal")
    .is("archived_at", null)
    .is("parent_id", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col gap-6">
      {/* Org documents */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3">
          Organization Documents
        </h2>
        {!orgPages || orgPages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <BookOpen className="mx-auto h-7 w-7 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No organization documents yet.</p>
            <p className="text-xs text-neutral-400 mt-1">
              Create pages with &ldquo;org&rdquo; visibility to share them with your team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orgPages.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all group"
              >
                <span className="text-2xl shrink-0">{p.icon ?? "📄"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-800 truncate group-hover:text-[var(--color-accent)] transition-colors">
                    {p.title || "Untitled"}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Updated {new Date(p.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Personal documents */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3">
          My Personal Pages
        </h2>
        {!personalPages || personalPages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <FileText className="mx-auto h-7 w-7 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No personal pages yet.</p>
            <Link
              href="/workspace"
              className="mt-2 inline-block text-xs text-[var(--color-accent)] hover:underline"
            >
              Go to workspace →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-neutral-50">
              {personalPages.map((p) => (
                <Link
                  key={p.id}
                  href={`/pages/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50/60 transition-colors group"
                >
                  <span className="text-lg shrink-0">{p.icon ?? "📄"}</span>
                  <span className="flex-1 text-sm font-medium text-neutral-800 truncate group-hover:text-[var(--color-accent)] transition-colors">
                    {p.title || "Untitled"}
                  </span>
                  <span className="text-xs text-neutral-400 shrink-0">
                    {new Date(p.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="admin" breadcrumbs={[{ label: "Admin" }, { label: "Documents" }]} /></Suspense>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Documents</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Organization and personal documents.
            </p>
          </div>
          <Link
            href="/workspace"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New page
          </Link>
        </div>
        <Suspense fallback={<TableSkeleton rows={4} cols={2} />}>
          <DocumentsContent />
        </Suspense>
      </div>
    </>
  );
}
