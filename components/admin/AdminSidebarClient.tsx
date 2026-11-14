"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "./AdminSidebar";

interface AdminSidebarClientProps {
  orgName: string;
  orgSlug: string;
  userEmail: string;
  userRole: string;
}

export function AdminSidebarClient({
  orgName,
  orgSlug,
  userEmail,
  userRole,
}: AdminSidebarClientProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <AdminSidebar
      orgName={orgName}
      orgSlug={orgSlug}
      userEmail={userEmail}
      userRole={userRole}
      onSignOut={handleSignOut}
    />
  );
}
