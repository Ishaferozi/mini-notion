import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { connection } from "next/server";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = { title: "Notifications – Admin" };

async function NotificationsContent() {
  await connection();
  const ctx = await requireMember();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return <NotificationsClient notifications={notifications ?? []} />;
}

export default function NotificationsPage() {
  return (
    <>      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Your recent activity and updates.</p>
        </div>
        <Suspense fallback={<TableSkeleton rows={5} cols={2} />}>
          <NotificationsContent />
        </Suspense>
      </div>
    </>
  );
}