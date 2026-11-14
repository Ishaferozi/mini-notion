import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { connection } from "next/server";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildPageTree } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmployeePagesClient } from "./EmployeePagesClient";
import type { Page } from "@/lib/types";

export const metadata = { title: "My Workspace – Employee" };

async function WorkspaceContent() {
  await connection();
  const ctx = await requireMember();
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", ctx.userId)
    .eq("visibility", "personal")
    .order("position", { ascending: true });

  const allPages: Page[] = pages ?? [];
  return <EmployeePagesClient pages={buildPageTree(allPages)} allPages={allPages} />;
}

export default function EmployeePagesPage() {
  return (
    <>      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Workspace</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Your personal pages, notes and documents.
          </p>
        </div>
        <Suspense fallback={<TableSkeleton rows={4} cols={2} />}>
          <WorkspaceContent />
        </Suspense>
      </div>
    </>
  );
}