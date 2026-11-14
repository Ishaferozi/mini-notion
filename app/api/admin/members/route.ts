import { NextResponse, type NextRequest } from "next/server";
import { getApiAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activityLog";
import type { MemberRole } from "@/lib/types";

// GET /api/admin/members — list all members with email
export async function GET() {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("organization_members")
    .select("id, user_id, role, joined_at, invited_by")
    .eq("org_id", ctx.orgId)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const admin = createAdminClient();
  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      return {
        ...m,
        email: data?.user?.email ?? "",
        display_name: (data?.user?.user_metadata?.full_name as string) ?? null,
      };
    })
  );

  return NextResponse.json({ data: enriched });
}

// PATCH /api/admin/members — change a member's role (admin or employee only)
export async function PATCH(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  let body: { member_id?: unknown; role?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const memberId = typeof body.member_id === "string" ? body.member_id : null;
  const role = typeof body.role === "string" ? body.role as MemberRole : null;

  if (!memberId || !role) {
    return NextResponse.json({ error: "member_id and role are required" }, { status: 400 });
  }
  if (!["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "Role must be admin or employee" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("organization_members")
    .select("id, role, org_id, user_id")
    .eq("id", memberId)
    .single();

  if (!target || target.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  // Admin cannot change their own role (would lock themselves out)
  if (target.user_id === ctx.userId) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void logActivity({ org_id: ctx.orgId, user_id: ctx.userId, entity_type: "member", entity_id: memberId, action: "role_changed", metadata: { new_role: role } });

  return NextResponse.json({ data });
}

// DELETE /api/admin/members?member_id=xxx — remove a member
export async function DELETE(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const memberId = new URL(request.url).searchParams.get("member_id");
  if (!memberId) return NextResponse.json({ error: "member_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("organization_members")
    .select("id, role, org_id, user_id")
    .eq("id", memberId)
    .single();

  if (!target || target.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  // Cannot remove yourself
  if (target.user_id === ctx.userId) {
    return NextResponse.json({ error: "Cannot remove yourself from the organization" }, { status: 403 });
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
