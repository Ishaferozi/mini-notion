/**
 * Server-side activity log helper.
 *
 * Uses service-role admin client so logs can be written regardless of RLS.
 * Activity logs are append-only — no updates or deletes.
 *
 * NEVER import this in client components.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityEntityType } from "@/lib/types";

interface ActivityPayload {
  org_id: string;
  user_id: string | null;
  entity_type: ActivityEntityType;
  entity_id: string;
  action: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record an activity log entry.
 * Silently swallows errors — logs are best-effort and must never
 * break the main request flow.
 */
export async function logActivity(payload: ActivityPayload) {
  try {
    const admin = createAdminClient();
    await admin.from("activity_logs").insert({
      org_id: payload.org_id,
      user_id: payload.user_id,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      action: payload.action,
      metadata: (payload.metadata ?? {}) as import("./supabase/types").Json,
    });
  } catch (err) {
    console.error("[activityLog] Failed to log activity:", err);
  }
}
