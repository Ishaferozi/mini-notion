import { NextResponse, type NextRequest } from "next/server";
import { getApiAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/notifications?limit=20 — fetch user's notifications
export async function GET(request: NextRequest) {
  const auth = await getApiAuth();
  if (auth instanceof Response) return auth;

  const limit = parseInt(new URL(request.url).searchParams.get("limit") ?? "20", 10);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 100));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// PATCH /api/notifications — mark notifications as read
// Body: { ids?: string[] }  — if omitted, marks ALL as read
export async function PATCH(request: NextRequest) {
  const auth = await getApiAuth();
  if (auth instanceof Response) return auth;

  let body: { ids?: unknown } = {};
  try { body = await request.json(); } catch { /* all read */ }

  const supabase = await createClient();
  const readAt = new Date().toISOString();

  let query = supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("user_id", auth.userId)
    .is("read_at", null);

  // If specific IDs provided, scope to them
  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = body.ids.filter((id): id is string => typeof id === "string");
    query = supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", auth.userId)
      .in("id", ids);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
