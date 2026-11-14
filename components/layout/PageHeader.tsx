import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./AppHeader";

interface PageHeaderProps {
  userRole: "admin" | "employee";
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Server component that fetches the real user email and renders AppHeader.
 * Pages that already call connection() (via requireAdmin/requireMember) can
 * use this directly — it piggybacks on the same request context.
 */
export async function PageHeader({ userRole, breadcrumbs = [] }: PageHeaderProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  return (
    <AppHeader
      userEmail={email}
      userRole={userRole}
      breadcrumbs={breadcrumbs}
    />
  );
}
