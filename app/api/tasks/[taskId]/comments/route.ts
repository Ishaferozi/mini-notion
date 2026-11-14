import { NextResponse, type NextRequest } from "next/server";
import { getApiAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activityLog";
import { notifyAdmins, createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ taskId: string }> };

// GET /api/tasks/[taskId]/comments
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { taskId } = await ctx.params;
  const auth = await getApiAuth();
  if (auth instanceof Response) return auth;

  const supabase = await createClient();

  // Verify task belongs to user's org (RLS handles this, but explicit check for clarity)
  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id")
    .eq("id", taskId)
    .eq("org_id", auth.orgId)
    .single();

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST /api/tasks/[taskId]/comments
// Body: { content: string }
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { taskId } = await ctx.params;
  const auth = await getApiAuth();
  if (auth instanceof Response) return auth;

  let body: { content?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 5000) {
    return NextResponse.json({ error: "Content must be 1–5000 characters" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id")
    .eq("id", taskId)
    .eq("org_id", auth.orgId)
    .single();

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      org_id: auth.orgId,
      user_id: auth.userId,
      content,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Activity + notifications ──
  void logActivity({ org_id: auth.orgId, user_id: auth.userId, entity_type: "comment", entity_id: data.id, action: "created", metadata: { task_id: taskId } });

  // Notify task assignee/creator about the comment
  const { data: taskRow } = await supabase.from("tasks").select("assignee_id, creator_id, title").eq("id", taskId).single();
  if (taskRow) {
    const recipients = new Set([taskRow.assignee_id, taskRow.creator_id].filter(Boolean) as string[]);
    recipients.delete(auth.userId); // don't notify yourself
    for (const uid of recipients) {
      void createNotification({ org_id: auth.orgId, user_id: uid, type: "task_comment", title: `New comment on: ${taskRow.title}`, body: content.slice(0, 100), link: `/employee/tasks` });
    }
  }

  return NextResponse.json({ data }, { status: 201 });
}
