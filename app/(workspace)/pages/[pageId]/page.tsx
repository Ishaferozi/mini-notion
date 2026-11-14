import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAncestors } from "@/lib/utils";
import { PageEditorShell } from "./PageEditorShell";
import { TopNavServer } from "@/components/layout/TopNavServer";
import { Spinner } from "@/components/ui/Spinner";
import type { Page, Block, BreadcrumbItem } from "@/lib/types";

interface PageViewProps {
  params: Promise<{ pageId: string }>;
}

async function PageContent({ params }: { params: Promise<{ pageId: string }> }) {
  await connection();
  const { pageId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (pageError || !page) notFound();

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("position", { ascending: true });

  const { data: allPages } = await supabase
    .from("pages")
    .select("id, parent_id, title, position, user_id, archived_at, cover, icon, org_id, visibility, created_at, updated_at")
    .eq("user_id", user.id);

  const ancestors = getAncestors(pageId, allPages ?? []);
  const breadcrumbs: BreadcrumbItem[] = [
    ...ancestors.map((p) => ({ id: p.id, title: p.title || "Untitled" })),
    { id: page.id, title: page.title || "Untitled" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top navigation bar */}
      <TopNavServer
        breadcrumbs={breadcrumbs}
        allPages={(allPages ?? []) as Page[]}
        userEmail={user.email ?? ""}
      />

      {/* Page content */}
      <PageEditorShell
        page={page as Page}
        initialBlocks={(blocks ?? []) as unknown as Block[]}
      />
    </div>
  );
}

export default function PageView({ params }: PageViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PageContent params={params} />
    </Suspense>
  );
}
