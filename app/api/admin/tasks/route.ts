import { NextResponse, type NextRequest } from "next/server";
import { getApiAdminAuth, getApiAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { logActivity } from "@/lib/activityLog";
import type { TaskPriority, TaskStatus } from "@/lib/types";

const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "completed"];

// GET /api/admin/tasks?project_id=xxx&status=xxx&priority=xxx
export async function GET(request: NextRequest) {
  // Allow any org member to GET tasks (employees need to see tasks too)
  const ctx = await getApiAuth();
  if (ctx instanceof Response) return ctx;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const status = searchParams.get("status") as TaskStatus | null;
  const priority = searchParams.get("priority") as TaskPriority | null;

  const supabase = await createClient();
  let query = supabase
    .from("tasks").select("*").eq("org_id", ctx.orgId)
    .order("position", { ascending: true });

  if (projectId) query = query.eq("project_id", projectId);
  if (status && VALID_STATUSES.includes(status)) query = query.eq("status", status);
  if (priority && VALID_PRIORITIES.includes(priority)) query = query.eq("priority", priority);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST /api/admin/tasks — any org member can create a task
export async function POST(request: NextRequest) {
  const ctx = await getApiAuth();
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const projectId = typeof body.project_id === "string" ? body.project_id : null;
  if (!projectId) return NextResponse.json({ error: "project_id is required" }, { status: 400 });

  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, org_id, name").eq("id", projectId).single();
  if (!project || project.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: siblings } = await supabase.from("tasks").select("position").eq("project_id", projectId);
  const maxPos = siblings?.length ? Math.max(...siblings.map((s) => s.position)) : 0;

  const priority: TaskPriority =
    typeof body.priority === "string" && VALID_PRIORITIES.includes(body.priority as TaskPriority)
      ? (body.priority as TaskPriority) : "medium";
  const assigneeId = typeof body.assignee_id === "string" ? body.assignee_id || null : null;
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const dueDate = typeof body.due_date === "string" ? body.due_date : null;

  const { data, error } = await supabase.from("tasks").insert({
    org_id: ctx.orgId, project_id: projectId, title, description,
    creator_id: ctx.userId, assignee_id: assigneeId, priority,
    status: "todo", due_date: dueDate, position: maxPos + 1000,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Notifications & activity (fire-and-forget) ──
  void logActivity({ org_id: ctx.orgId, user_id: ctx.userId, entity_type: "task", entity_id: data.id, action: "created", metadata: { title, project: project.name } });

  // Notify assigned employee if someone was assigned
  if (assigneeId && assigneeId !== ctx.userId) {
    void createNotification({
      org_id: ctx.orgId, user_id: assigneeId, type: "task_assigned",
      title: `New task assigned: ${title}`,
      body: `You were assigned a task in ${project.name}.`,
      link: `/employee/tasks`,
    });
  }

  // Notify admins that a task was created (if created by employee)
  if (ctx.role === "employee") {
    void notifyAdmins(ctx.orgId, {
      type: "task_created",
      title: `New task created: ${title}`,
      body: `${ctx.email} created a task in ${project.name}.`,
      link: `/tasks`,
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/admin/tasks — creator, assignee, or admin can update
export async function PATCH(request: NextRequest) {
  const ctx = await getApiAuth();
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const taskId = typeof body.task_id === "string" ? body.task_id : null;
  if (!taskId) return NextResponse.json({ error: "task_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase.from("tasks")
    .select("id, org_id, title, status, assignee_id, creator_id").eq("id", taskId).single();

  if (!existing || existing.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Permission: admin can edit any; employee can only edit their own tasks
  const isAdmin = ctx.role === "admin";
  const isCreatorOrAssignee = existing.creator_id === ctx.userId || existing.assignee_id === ctx.userId;
  if (!isAdmin && !isCreatorOrAssignee) {
    return NextResponse.json({ error: "Not authorized to update this task" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title.trim().slice(0, 500);
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.priority === "string" && VALID_PRIORITIES.includes(body.priority as TaskPriority)) updates.priority = body.priority;
  if (typeof body.status === "string" && VALID_STATUSES.includes(body.status as TaskStatus)) updates.status = body.status;
  if (isAdmin && "assignee_id" in body) updates.assignee_id = body.assignee_id ?? null;
  if (typeof body.due_date === "string") updates.due_date = body.due_date || null;

  if (!Object.keys(updates).length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { data, error } = await supabase.from("tasks").update(updates as never).eq("id", taskId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Notifications & activity ──
  void logActivity({ org_id: ctx.orgId, user_id: ctx.userId, entity_type: "task", entity_id: taskId, action: updates.status ? `status_changed_to_${updates.status}` : "updated", metadata: { title: existing.title } });

  // Notify on completion
  if (updates.status === "completed" && existing.status !== "completed") {
    void notifyAdmins(ctx.orgId, {
      type: "task_completed",
      title: `Task completed: ${existing.title}`,
      body: `${ctx.email} marked a task as completed.`,
      link: `/tasks`,
    });
  }

  // Notify on reassignment
  if (isAdmin && "assignee_id" in body && body.assignee_id && body.assignee_id !== existing.assignee_id) {
    void createNotification({
      org_id: ctx.orgId, user_id: body.assignee_id as string,
      type: "task_assigned",
      title: `Task assigned to you: ${existing.title}`,
      body: `An admin assigned this task to you.`,
      link: `/employee/tasks`,
    });
  }

  return NextResponse.json({ data });
}

// DELETE /api/admin/tasks?task_id=xxx
export async function DELETE(request: NextRequest) {
  const ctx = await getApiAdminAuth();
  if (ctx instanceof Response) return ctx;

  const taskId = new URL(request.url).searchParams.get("task_id");
  if (!taskId) return NextResponse.json({ error: "task_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase.from("tasks").select("id, org_id, title").eq("id", taskId).single();

  if (!existing || existing.org_id !== ctx.orgId) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void logActivity({ org_id: ctx.orgId, user_id: ctx.userId, entity_type: "task", entity_id: taskId, action: "deleted", metadata: { title: existing.title } });

  return new NextResponse(null, { status: 204 });
}
