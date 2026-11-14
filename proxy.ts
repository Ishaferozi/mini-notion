import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy — auth guard + role-based routing.
 *
 * Admin pages live at: /dashboard, /members, /invitations, /projects,
 *   /tasks, /reports, /activity, /profile, /settings, /roles, /workspace
 * Employee pages live at: /employee/*
 * Auth pages: /login, /signup, /org-setup, /invite/*
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // ── Route classification ───────────────────────────────────────────────────

  const isApi          = pathname.startsWith("/api/");
  const isStatic       = pathname.startsWith("/_next/");
  const isInvite       = pathname.startsWith("/invite/");
  const isAuthPage     = pathname.startsWith("/login") ||
                          pathname.startsWith("/signup") ||
                          pathname.startsWith("/forgot-password") ||
                          pathname.startsWith("/reset-password");
  const isOrgSetup     = pathname.startsWith("/org-setup");
  const isUnauthorized = pathname.startsWith("/unauthorized");
  const isEmployeePage = pathname.startsWith("/employee");

  // These are the admin-only page paths (no /admin prefix — route group is invisible)
  const ADMIN_ONLY_PATHS = [
    "/dashboard", "/members", "/invitations", "/projects",
    "/tasks", "/reports", "/activity", "/settings", "/roles",
  ];
  const isAdminPage = ADMIN_ONLY_PATHS.some((p) =>
    pathname === p || pathname.startsWith(p + "/")
  );

  // Skip proxy for static assets and API routes
  if (isApi || isStatic) return response;

  // ── Unauthenticated ────────────────────────────────────────────────────────

  if (!user) {
    if (isAuthPage || isOrgSetup || isInvite || isUnauthorized) return response;
    const url = new URL("/login", request.url);
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // ── Authenticated ──────────────────────────────────────────────────────────

  // Authenticated user hitting login/signup → redirect away from auth pages
  if (isAuthPage) {
    // Don't redirect yet — first check their role below
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = member?.role;
    if (!role) {
      return NextResponse.redirect(new URL("/org-setup", request.url));
    }
    const isAdminUser = role === "admin";
    const dest = isAdminUser ? "/dashboard" : "/employee/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Allow invite pages always (user needs to accept even if already has org)
  if (isInvite) return response;

  // Fetch membership
  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = member?.role;
  const isAdminOrOwner = role === "admin";

  // No org yet — send to setup (allow org-setup page through)
  if (!role) {
    if (isOrgSetup || isUnauthorized) return response;
    return NextResponse.redirect(new URL("/org-setup", request.url));
  }

  // Has org — redirect away from org-setup
  if (isOrgSetup) {
    const dest = isAdminOrOwner ? "/dashboard" : "/employee/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Root "/" → role-based redirect
  if (pathname === "/") {
    const dest = isAdminOrOwner ? "/dashboard" : "/employee/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Employees cannot access admin pages
  if (isAdminPage && !isAdminOrOwner) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Admins trying to access /employee/* → redirect to admin dashboard
  if (isEmployeePage && isAdminOrOwner) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
