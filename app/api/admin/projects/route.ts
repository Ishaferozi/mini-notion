import { NextResponse, type NextRequest } from "next/server";
import { getApiAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activityLog";
import { notifyAllMembers } from "@/lib/notifications";
import type { ProjectStatus } from "@/lib/types";

const VALID_STATUSES: ProjectStatus[] = ["active", "on_hold", "completed", "archived"];

// GET /api/admin/projects
export async function GET() {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST /api/admin/projects
// Body: { name, description?, status? }
export async function POST(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  let body: { name?: unknown; description?: unknown; status?: unknown; start_date?: unknown; due_date?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length < 1 || name.length > 200) {
    return NextResponse.json({ error: "Project name must be 1–200 characters" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : null;
  const status: ProjectStatus =
    typeof body.status === "string" && VALID_STATUSES.includes(body.status as ProjectStatus)
      ? (body.status as ProjectStatus)
      : "active";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ org_id: ctx.orgId, name, description, status, created_by: ctx.userId,
              start_date: typeof body.start_date === "string" ? body.start_date || null : null,
              due_date: typeof body.due_date === "string" ? body.due_date || null : null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void logActivity({ org_id: ctx.orgId, user_id: ctx.userId, entity_type: "project", entity_id: data.id, action: "created", metadata: { name } });
  void notifyAllMembers(ctx.orgId, { type: "project_created", title: `New project: ${name}`, body: "A new project has been created in your organization.", link: `/projects` });

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/admin/projects
// Body: { project_id, name?, description?, status? }
export async function PATCH(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const projectId = typeof body.project_id === "string" ? body.project_id : null;
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("projects").select("id, org_id").eq("id", projectId).single();

  if (!existing || existing.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name.trim().slice(0, 200);
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.status === "string" && VALID_STATUSES.includes(body.status as ProjectStatus)) {
    updates.status = body.status;
  }
  if ("start_date" in body) updates.start_date = body.start_date || null;
  if ("due_date" in body) updates.due_date = body.due_date || null;

  if (!Object.keys(updates).length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { data, error } = await supabase
    .from("projects").update(updates as never).eq("id", projectId).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/admin/projects?project_id=xxx
export async function DELETE(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const projectId = new URL(request.url).searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("projects").select("id, org_id").eq("id", projectId).single();

  if (!existing || existing.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
