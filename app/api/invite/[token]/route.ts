import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ token: string }> };

/**
 * GET /api/invite/[token]
 * Returns public invitation info (org name, invited email, role, expiry).
 * Does NOT require authentication — the invite page is public.
 * Uses admin client to read invitations without RLS restrictions.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;

  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invite, error } = await admin
    .from("invitations")
    .select("id, email, role, expires_at, accepted_at, org_id")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json(
      { error: "Invitation not found or has already been used." },
      { status: 404 }
    );
  }

  if (invite.accepted_at) {
    return NextResponse.json(
      { error: "This invitation has already been accepted." },
      { status: 410 }
    );
  }

  // Fetch org name
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", invite.org_id)
    .single();

  return NextResponse.json({
    data: {
      org_name: org?.name ?? "Unknown organization",
      email: invite.email,
      role: invite.role,
      expires_at: invite.expires_at,
    },
  });
}
