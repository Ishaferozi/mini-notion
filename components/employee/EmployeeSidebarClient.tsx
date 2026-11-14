"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EmployeeSidebar } from "./EmployeeSidebar";

interface Props {
  orgName: string;
  userEmail: string;
}

export function EmployeeSidebarClient({ orgName, userEmail }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <EmployeeSidebar
      orgName={orgName}
      userEmail={userEmail}
      onSignOut={handleSignOut}
    />
  );
}
