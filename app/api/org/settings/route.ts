import { NextResponse, type NextRequest } from "next/server";
import { getApiAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/org/settings — update org name and slug
export async function PATCH(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  // Only owner can change settings
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Only admins can change settings." }, { status: 403 });
  }

  let body: { name?: unknown; slug?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : null;
  const slug = typeof body.slug === "string" ? body.slug.trim() : null;

  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Name must be 2–100 characters." }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9-]{2,50}$/.test(slug)) {
    return NextResponse.json({ error: "Slug must be 2–50 lowercase letters, numbers, or hyphens." }, { status: 400 });
  }

  const supabase = await createClient();

  // Check slug uniqueness (excluding current org)
  const { data: existing } = await supabase
    .from("organizations").select("id").eq("slug", slug).neq("id", ctx.orgId).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "This slug is already taken." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({ name, slug })
    .eq("id", ctx.orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
