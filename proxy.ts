import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly middleware.ts).
 *
 * Runs before every matched request to:
 *   1. Refresh the Supabase session token if it has expired.
 *   2. Redirect unauthenticated users away from protected workspace routes.
 *   3. Redirect authenticated users away from auth routes (login/signup).
 *
 * IMPORTANT: We always verify auth server-side inside each Server Action and
 * Route Handler as well — this proxy is a convenience layer, not the sole
 * security boundary.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // Create a Supabase client that can read and write cookies on the response.
  // This is what refreshes expiring tokens and writes the updated session
  // back to the browser before the page renders.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Write updated cookies onto the request so downstream server
          // components see the refreshed session immediately.
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          // Recreate the response so we can attach Set-Cookie headers.
          response = NextResponse.next({ request });

          // Apply cache-prevention headers provided by the library.
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          // Write the updated cookies onto the response so the browser
          // stores the refreshed tokens.
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Call getUser() here to trigger a token refresh if needed.
  // Do NOT use getSession() — it trusts the client-side cookie without
  // re-validating with the Supabase server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Any route that is not an auth route and not an API route is a workspace route.
  // API routes (/api/*) are protected server-side in each handler — the proxy
  // should not redirect them (the handler returns 401 JSON instead).
  const isApiRoute = pathname.startsWith("/api/");

  const isWorkspaceRoute =
    !isApiRoute &&
    !isAuthRoute &&
    (pathname.startsWith("/pages") ||
      pathname === "/" ||
      pathname.startsWith("/workspace"));

  // Unauthenticated user trying to access a workspace route → send to login.
  if (!user && isWorkspaceRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting login/signup → send to workspace root.
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files (*.png, *.svg, etc.)
     *
     * This keeps the proxy fast — it only runs on actual page/API requests.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
