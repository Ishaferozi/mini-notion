import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./AppHeader";

interface PageHeaderProps {
  userRole: "admin" | "employee";
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Server component that reads the real user email and renders AppHeader.
 * connection() marks this as dynamic so Next.js 16 doesn't try to prerender it.
 */
export async function PageHeader({ userRole, breadcrumbs = [] }: PageHeaderProps) {
  await connection();
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
