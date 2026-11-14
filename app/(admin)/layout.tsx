import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebarClient } from "@/components/admin/AdminSidebarClient";
import { MobileMenuWrapper } from "@/components/layout/MobileMenuWrapper";

async function AdminShellData({
  children,
}: {
  children: (props: {
    orgName: string;
    orgSlug: string;
    userEmail: string;
    userRole: string;
  }) => React.ReactNode;
}) {
  await connection();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug)")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/org-setup");
  if (member.role === "employee") redirect("/employee/dashboard");

  const org = Array.isArray(member.organizations)
    ? member.organizations[0]
    : member.organizations;

  return (
    <>
      {children({
        orgName: org?.name ?? "My Organization",
        orgSlug: org?.slug ?? "",
        userEmail: user.email ?? "",
        userRole: member.role,
      })}
    </>
  );
}

const SidebarFallback = () => (
  <aside
    className="flex h-full items-center justify-center"
    style={{ width: "var(--sidebar-width)", background: "var(--sidebar-bg)" }}
  >
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
  </aside>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Suspense fallback={<SidebarFallback />}>
          <AdminShellData>
            {(props) => <AdminSidebarClient {...props} />}
          </AdminShellData>
        </Suspense>
      </div>

      {/* Mobile sidebar drawer */}
      <div className="md:hidden">
        <Suspense fallback={null}>
          <AdminShellData>
            {(props) => <MobileMenuWrapper role="admin" {...props} />}
          </AdminShellData>
        </Suspense>
      </div>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-y-auto min-w-0 bg-white">
        {children}
      </main>
    </div>
  );
}
