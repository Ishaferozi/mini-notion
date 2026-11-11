"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Creates (or returns the cached singleton) Supabase client for use in
 * Client Components.
 *
 * @supabase/ssr automatically reads/writes cookies via document.cookie
 * when no custom cookie methods are provided, so no additional config
 * is needed here.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
