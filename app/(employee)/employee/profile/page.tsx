import { Suspense } from "react";
import { connection } from "next/server";
import { requireMember } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { ProfileClient } from "@/app/(admin)/profile/ProfileClient";

export const metadata = { title: "My Profile – Employee" };

async function ProfileContent() {
  await connection();
  const ctx = await requireMember();
  return (
    <ProfileClient
      userId={ctx.userId}
      email={ctx.email}
      role={ctx.role}
      orgName={ctx.org.name}
      orgSlug={ctx.org.slug}
    />
  );
}

export default function EmployeeProfilePage() {
  return (
    <>
      <Suspense fallback={null}><PageHeader userRole="employee" breadcrumbs={[{ label: "Employee" }, { label: "My Profile" }]} /></Suspense>
      <div className="p-6 md:p-8">
        <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
          <ProfileContent />
        </Suspense>
      </div>
    </>
  );
}
