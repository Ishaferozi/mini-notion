import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/org/setup
 * Creates a new organization and sets the authenticated user as owner.
 *
 * Body: { name: string, slug: string }
 *
 * Security:
 *   - Uses the server client to verify the user is authenticated.
 *   - Uses the admin client (service role) to INSERT into organizations
 *     and organization_members — these tables have no client INSERT RLS
 *     for org creation (the org doesn't exist yet, so get_my_org_id() = null).
 *   - Verifies the user has no existing org membership before creating.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user doesn't already have an org
  const { data: existingMember } = await supabase
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

  // Parse and validate body
  let body: { name?: unknown; slug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json(
      { error: "Organization name must be between 2 and 100 characters." },
      { status: 400 }
    );
  }

  const slugPattern = /^[a-z0-9-]{2,50}$/;
  if (!slugPattern.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be 2–50 lowercase letters, numbers, or hyphens." },
      { status: 400 }
    );
  }

  // Use admin client to bypass RLS for org creation
  const adminClient = createAdminClient();

  // Check slug uniqueness
  const { data: existingOrg } = await adminClient
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingOrg) {
    return NextResponse.json(
      { error: "This URL slug is already taken. Please choose another." },
      { status: 409 }
    );
  }

  // Create the organization
  const { data: org, error: orgError } = await adminClient
    .from("organizations")
    .insert({ name, slug, owner_id: user.id })
    .select()
    .single();

  if (orgError || !org) {
    console.error("[org/setup] org insert error:", orgError);
    return NextResponse.json(
      { error: "Failed to create organization. Please try again." },
      { status: 500 }
    );
  }

  // Add the user as admin (first user creating the org is the admin)
  const { error: memberError } = await adminClient
    .from("organization_members")
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: "admin",
    });

  if (memberError) {
    // Rollback: delete the org we just created
    await adminClient.from("organizations").delete().eq("id", org.id);
    console.error("[org/setup] member insert error:", memberError);
    return NextResponse.json(
      { error: "Failed to set up organization membership. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { org } }, { status: 201 });
}
