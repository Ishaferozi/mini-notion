import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { connection } from "next/server";
import { requireMember } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "My Profile – Admin" };

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

export default function ProfilePage() {
  return (
    <>      <div className="p-6 md:p-8">
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
        <ProfileContent />
      </Suspense>
    </div>
    </>
  );
}