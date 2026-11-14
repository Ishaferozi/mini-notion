import { Suspense } from "react";
import { connection } from "next/server";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata = { title: "Documents – Employee" };

async function DocumentsContent() {
  await connection();
  const ctx = await requireMember();
  const supabase = await createClient();

  // Org-visible pages (shared documents)
  const { data: orgPages } = await supabase
    .from("pages")
    .select("id, title, icon, updated_at")
    .eq("org_id", ctx.orgId)
    .eq("visibility", "org")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!orgPages || orgPages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-14 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-neutral-300 mb-3" />
        <p className="text-sm font-medium text-neutral-600">No shared documents yet.</p>
        <p className="text-xs text-neutral-400 mt-1">Organization documents created by your admin will appear here.</p>
      </div>
    );
  }

  return (
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
  );
}

export default function EmployeeDocumentsPage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="employee" breadcrumbs={[{ label: "Employee" }, { label: "Documents" }]} /></Suspense>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Documents</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Shared organization documents and resources.
          </p>
        </div>
        <Suspense fallback={<TableSkeleton rows={4} cols={2} />}>
          <DocumentsContent />
        </Suspense>
      </div>
    </>
  );
}
