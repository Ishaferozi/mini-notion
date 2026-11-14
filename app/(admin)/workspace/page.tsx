import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildPageTree } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { WorkspaceClient } from "./WorkspaceClient";
import type { Page } from "@/lib/types";

export const metadata = { title: "Workspace – Admin" };

async function WorkspaceContent() {
  await connection();
  const ctx = await requireAdmin();
  const supabase = await createClient();

  // Fetch personal pages
  const { data: personalPages } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", ctx.userId)
    .eq("visibility", "personal")
    .order("position", { ascending: true });

  // Fetch org-visible pages
  const { data: orgPages } = await supabase
    .from("pages")
    .select("*")
    .eq("org_id", ctx.orgId)
    .eq("visibility", "org")
    .order("position", { ascending: true });

  const personal: Page[] = personalPages ?? [];
  const org: Page[] = orgPages ?? [];

  return (
    <WorkspaceClient
      pages={buildPageTree(personal)}
      allPages={personal}
      orgPages={org}
      orgId={ctx.orgId}
    />
  );
}

export default function WorkspacePage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="admin" breadcrumbs={[{ label: "Admin" }, { label: "Workspace" }]} /></Suspense>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Workspace</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Your personal pages and organization documents.
          </p>
        </div>
        <Suspense fallback={<TableSkeleton rows={5} cols={2} />}>
          <WorkspaceContent />
        </Suspense>
      </div>
    </>
  );
}
