import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. A new instance must be created per request — never
 * share across requests.
 *
 * Uses the Next.js cookies() API (async in Next.js 16) to read and write
 * session cookies so that token refreshes are propagated back to the browser.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component where cookies cannot
            // be written. The proxy.ts client handles the token refresh, so
            // this is safe to swallow here.
          }
        },
      },
    }
  );
}
