import { NextResponse, type NextRequest } from "next/server";
import { getApiAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/types";

// GET /api/admin/invitations — list all invitations for the org
export async function GET() {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST /api/admin/invitations — create a new invitation
// Body: { email: string, role: MemberRole }
export async function POST(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  let body: { email?: unknown; role?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" ? body.role as MemberRole : "employee";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "Role must be admin or employee" }, { status: 400 });
  }

  const supabase = await createClient();

  // Check if email is already a member
  const { data: existingMembers } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("org_id", ctx.orgId);

  // We can't directly query auth.users by email from client, so we check invitations
  const { data: existing } = await supabase
    .from("invitations")
    .select("id, accepted_at, expires_at")
    .eq("org_id", ctx.orgId)
    .eq("email", email)
    .maybeSingle();

  if (existing && !existing.accepted_at && new Date(existing.expires_at) > new Date()) {
    return NextResponse.json(
      { error: "A pending invitation already exists for this email." },
      { status: 409 }
    );
  }

  // Upsert: delete old expired/accepted invite for this email+org, then insert fresh
  if (existing) {
    await supabase.from("invitations").delete().eq("id", existing.id);
  }

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      org_id: ctx.orgId,
      email,
      role,
      invited_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

// DELETE /api/admin/invitations?invitation_id=xxx — revoke invitation
export async function DELETE(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const invId = new URL(request.url).searchParams.get("invitation_id");
  if (!invId) return NextResponse.json({ error: "invitation_id required" }, { status: 400 });

  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("invitations")
    .select("id, org_id")
    .eq("id", invId)
    .single();

  if (!inv || inv.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const { error } = await supabase.from("invitations").delete().eq("id", invId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
