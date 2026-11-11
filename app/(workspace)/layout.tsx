import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPageTree } from "@/lib/utils";
import { SidebarClient } from "@/components/sidebar/SidebarClient";
import { MobileSidebarWrapper } from "@/components/sidebar/MobileSidebarWrapper";
import { Spinner } from "@/components/ui/Spinner";
import type { Page } from "@/lib/types";

async function SidebarData({
  children,
}: {
  children: (props: {
    pages: ReturnType<typeof buildPageTree>;
    allPages: Page[];
    email: string;
  }) => React.ReactNode;
}) {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  const allPages: Page[] = pages ?? [];
  const pageTree = buildPageTree(allPages);

  return <>{children({ pages: pageTree, allPages, email: user.email ?? "" })}</>;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden md:flex h-full shrink-0">
        <Suspense
          fallback={
            <aside className="flex h-full w-60 items-center justify-center border-r border-neutral-200 bg-neutral-50">
              <Spinner size="sm" />
            </aside>
          }
        >
          <SidebarData>
            {({ pages, allPages, email }) => (
              <SidebarClient
                pages={pages}
                allPages={allPages}
                userEmail={email}
              />
            )}
          </SidebarData>
        </Suspense>
      </div>

      {/* ── Mobile sidebar (drawer, hidden on desktop) ── */}
      <div className="md:hidden">
        <Suspense fallback={null}>
          <SidebarData>
            {({ pages, allPages, email }) => (
              <MobileSidebarWrapper
                pages={pages}
                allPages={allPages}
                userEmail={email}
              />
            )}
          </SidebarData>
        </Suspense>
      </div>

      {/* ── Main content ── */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-white min-w-0">
        {children}
      </main>
    </div>
  );
}
