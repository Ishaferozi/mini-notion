import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceEmptyActions } from "./WorkspaceEmptyActions";
import { TopNavServer } from "@/components/layout/TopNavServer";
import { Spinner } from "@/components/ui/Spinner";

export const metadata = {
  title: "Mini Notion",
};

async function WorkspaceContent() {
  await connection();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pages } = await supabase
    .from("pages")
    .select("id")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (pages && pages.length > 0) {
    redirect(`/pages/${pages[0].id}`);
  }

  return (
    <div className="flex flex-col h-full">
      <TopNavServer breadcrumbs={[]} allPages={[]} userEmail={user.email ?? ""} />
      <div className="flex flex-1 items-center justify-center">
        <WorkspaceEmptyActions />
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
