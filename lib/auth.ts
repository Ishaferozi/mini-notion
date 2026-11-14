/**
 * Server-side authentication and authorization helpers.
 * Two roles only: 'admin' | 'employee'
 * The first user to create an org becomes its admin.
 * Only admins can invite/promote others to admin.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext, MemberRole } from "@/lib/types";

// ─── Core: get the authenticated Supabase user ────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// ─── Org membership ───────────────────────────────────────────────────────────

export async function getCurrentMember(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (memberError || !member) return null;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", member.org_id)
    .single();

  if (orgError || !org) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    orgId: member.org_id,
    role: member.role,
    org,
  };
}

/**
 * Returns AuthContext or redirects to /org-setup if user has no org.
 */
export async function requireMember(): Promise<AuthContext> {
  await requireAuth();
  const ctx = await getCurrentMember();
  if (!ctx) redirect("/org-setup");
  return ctx;
}

/**
 * Role hierarchy: admin(2) > employee(1).
 * requireRole("admin") → passes only admins.
 * requireRole("employee") → passes any role.
 */
export async function requireRole(minimumRole: MemberRole): Promise<AuthContext> {
  const ctx = await requireMember();

  const hierarchy: Record<MemberRole, number> = {
    admin: 2,
    employee: 1,
  };

  if (hierarchy[ctx.role] < hierarchy[minimumRole]) {
    redirect("/unauthorized");
  }

  return ctx;
}

/** Requires admin role. */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole("admin");
}

// ─── API route helpers ────────────────────────────────────────────────────────

export async function getApiAuth(): Promise<AuthContext | Response> {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getCurrentMember();
  if (!ctx) {
    return Response.json({ error: "No organization membership found" }, { status: 403 });
  }
  return ctx;
}

export async function getApiAdminAuth(): Promise<AuthContext | Response> {
  const ctx = await getApiAuth();
  if (ctx instanceof Response) return ctx;
  if (ctx.role !== "admin") {
    return Response.json({ error: "Admin role required" }, { status: 403 });
  }
  return ctx;
}
