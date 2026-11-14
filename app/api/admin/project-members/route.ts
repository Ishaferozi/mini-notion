import { NextResponse, type NextRequest } from "next/server";
import { getApiAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/project-members — add a member to a project
export async function POST(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  let body: { project_id?: unknown; user_id?: unknown; org_id?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const projectId = typeof body.project_id === "string" ? body.project_id : null;
  const userId = typeof body.user_id === "string" ? body.user_id : null;

  if (!projectId || !userId) {
    return NextResponse.json({ error: "project_id and user_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify project belongs to org
  const { data: project } = await supabase
    .from("projects").select("id, org_id").eq("id", projectId).single();
  if (!project || project.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify user is in org
  const { data: member } = await supabase
    .from("organization_members").select("user_id")
    .eq("org_id", ctx.orgId).eq("user_id", userId).single();
  if (!member) {
    return NextResponse.json({ error: "User is not a member of this organization" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, org_id: ctx.orgId })
    .select().single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// DELETE /api/admin/project-members?project_id=x&user_id=y
export async function DELETE(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const params = new URL(request.url).searchParams;
  const projectId = params.get("project_id");
  const userId = params.get("user_id");

  if (!projectId || !userId) {
    return NextResponse.json({ error: "project_id and user_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("org_id", ctx.orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
