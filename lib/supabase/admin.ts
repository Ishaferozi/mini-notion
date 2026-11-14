import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Admin Supabase client using the service-role key.
 *
 * IMPORTANT:
 *   - Only import this in SERVER-SIDE code (Route Handlers, Server Actions).
 *   - Never expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
 *   - This client bypasses RLS — use only when necessary (org creation,
 *     invitation acceptance, activity logging).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Add SUPABASE_SERVICE_ROLE_KEY to your .env.local (server-side only — never NEXT_PUBLIC_)."
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
