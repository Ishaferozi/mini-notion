import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeSidebarClient } from "@/components/employee/EmployeeSidebarClient";
import { MobileMenuWrapper } from "@/components/layout/MobileMenuWrapper";

async function EmployeeShellData({
  children,
}: {
  children: (props: { orgName: string; userEmail: string }) => React.ReactNode;
}) {
  await connection();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organization_members")
    .select("role, organizations(name)")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/org-setup");

  const org = Array.isArray(member.organizations)
    ? member.organizations[0]
    : member.organizations;

  return <>{children({ orgName: org?.name ?? "My Organization", userEmail: user.email ?? "" })}</>;
}

const SidebarFallback = () => (
  <aside
    className="flex h-full items-center justify-center"
    style={{ width: "var(--sidebar-width)", background: "var(--sidebar-bg)" }}
  >
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
  </aside>
);

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Suspense fallback={<SidebarFallback />}>
          <EmployeeShellData>
            {(props) => <EmployeeSidebarClient {...props} />}
          </EmployeeShellData>
        </Suspense>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <Suspense fallback={null}>
          <EmployeeShellData>
            {(props) => <MobileMenuWrapper role="employee" {...props} />}
          </EmployeeShellData>
        </Suspense>
      </div>

      <main className="flex flex-1 flex-col overflow-y-auto min-w-0 bg-white">
        {children}
      </main>
    </div>
  );
}
