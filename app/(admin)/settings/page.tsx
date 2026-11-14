import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { OrgSettingsClient } from "./OrgSettingsClient";

export const metadata = { title: "Settings – Admin" };

async function SettingsContent() {
  await connection();
  const ctx = await requireAdmin();
  return (
    <OrgSettingsClient
      orgId={ctx.orgId}
      orgName={ctx.org.name}
      orgSlug={ctx.org.slug}
      logoUrl={ctx.org.logo_url}
      userRole={ctx.role}
    />
  );
}

export default function SettingsPage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="admin" breadcrumbs={[{ label: "Admin" }, { label: "Org Settings" }]} /></Suspense>
      <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your organization settings.
        </p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
        <SettingsContent />
      </Suspense>
    </div>
    </>
  );
}
