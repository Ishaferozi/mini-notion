import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { logActivity } from "@/lib/activityLog";

/**
 * POST /api/invite/accept
 * Accepts an invitation: validates token, creates member row, marks invite used.
 *
 * Body: { token: string }
 *
 * Security:
 *   - Requires authenticated user (checked via server client).
 *   - Verifies the invitation email matches the authenticated user's email.
 *   - Verifies the token is not expired and not already accepted.
 *   - Uses admin client to write member row (bypasses RLS — user has no org yet).
 *   - One org per user enforced by UNIQUE(user_id) in DB.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Must be authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch and validate invitation
  const { data: invite, error: inviteError } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invitation not found." },
      { status: 404 }
    );
  }

  if (invite.accepted_at) {
    return NextResponse.json(
      { error: "This invitation has already been accepted." },
      { status: 410 }
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invitation has expired. Please ask your admin to send a new one." },
      { status: 410 }
    );
  }

  // Invitation email must match the authenticated user's email
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invitation was sent to ${invite.email}. Please sign in with that email address.`,
      },
      { status: 403 }
    );
  }

  // Check user doesn't already have an org
  const { data: existingMember } = await admin
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      { error: "You are already a member of an organization." },
      { status: 400 }
    );
  }

  // Create member row
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role,
      invited_by: invite.invited_by,
    });

  if (memberError) {
    console.error("[invite/accept] member insert error:", memberError);
    return NextResponse.json(
      { error: "Failed to join organization. Please try again." },
      { status: 500 }
    );
  }

  // Mark invitation as accepted
  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // ── Activity + notifications ──
  void logActivity({
    org_id: invite.org_id, user_id: user.id, entity_type: "member",
    entity_id: user.id, action: "joined",
    metadata: { email: user.email, role: invite.role },
  });
  void notifyAdmins(invite.org_id, {
    type: "member_joined",
    title: `${user.email} joined the organization`,
    body: `They accepted an invitation and joined as ${invite.role}.`,
    link: `/members`,
  });

  return NextResponse.json({
    data: { org_id: invite.org_id, role: invite.role },
  });
}
