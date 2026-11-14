/**
 * Server-side notification helper.
 *
 * Uses the service-role admin client to bypass RLS so notifications can be
 * written even when the acting user is not yet the target's org member.
 *
 * NEVER import this in client components.
 */

import { createAdminClient } from "@/lib/supabase/admin";

interface NotificationPayload {
  org_id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Insert a single notification.
 * Silently swallows errors — notifications are best-effort and must never
 * break the main request flow.
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      org_id: payload.org_id,
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
    });
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err);
  }
}

/**
 * Notify all admins in an org.
 * Fetches admin user_ids then bulk-inserts one notification per admin.
 */
export async function notifyAdmins(
  orgId: string,
  payload: Omit<NotificationPayload, "org_id" | "user_id">
) {
  try {
    const admin = createAdminClient();
    const { data: admins } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "admin");

    if (!admins?.length) return;

    await admin.from("notifications").insert(
      admins.map((a) => ({
        org_id: orgId,
        user_id: a.user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        link: payload.link ?? null,
      }))
    );
  } catch (err) {
    console.error("[notifications] Failed to notify admins:", err);
  }
}

/**
 * Notify all members in an org (admin + employee).
 */
export async function notifyAllMembers(
  orgId: string,
  payload: Omit<NotificationPayload, "org_id" | "user_id">
) {
  try {
    const admin = createAdminClient();
    const { data: members } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("org_id", orgId);

    if (!members?.length) return;

    await admin.from("notifications").insert(
      members.map((m) => ({
        org_id: orgId,
        user_id: m.user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        link: payload.link ?? null,
      }))
    );
  } catch (err) {
    console.error("[notifications] Failed to notify all members:", err);
  }
}
