"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { EmployeeSidebar } from "@/components/employee/EmployeeSidebar";

type Role = "admin" | "employee";

interface MobileMenuWrapperProps {
  role: Role;
  orgName: string;
  orgSlug?: string;
  userEmail: string;
  userRole?: string;
}

export function MobileMenuWrapper({
  role,
  orgName,
  orgSlug = "",
  userEmail,
  userRole = role,
}: MobileMenuWrapperProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const SidebarComp =
    role === "admin" ? (
      <AdminSidebar
        orgName={orgName}
        orgSlug={orgSlug}
        userEmail={userEmail}
        userRole={userRole}
        onSignOut={handleSignOut}
      />
    ) : (
      <EmployeeSidebar
        orgName={orgName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />
    );

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm text-neutral-600 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{ width: "var(--sidebar-width)" }}
      >
        <div className="relative h-full" onClick={() => setOpen(false)}>
          {SidebarComp}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
