import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clampTitle, nextPosition, isAncestorOrSelf } from "@/lib/utils";
import type { Page } from "@/lib/types";

// ── GET /api/pages ────────────────────────────────────────────────────────────
// Returns all non-archived pages for the authenticated user, ordered by position.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ── POST /api/pages ───────────────────────────────────────────────────────────
// Creates a new page. Body: { title?, parent_id? }
// Validates parent ownership and assigns the next position among siblings.
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: unknown; parent_id?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const title = clampTitle(
    typeof body.title === "string" ? body.title.trim() : "Untitled"
  );

  const parent_id =
    typeof body.parent_id === "string" && body.parent_id.trim()
      ? body.parent_id.trim()
      : null;

  // If a parent_id is provided, verify it belongs to this user.
  if (parent_id) {
    const { data: parent } = await supabase
      .from("pages")
      .select("id, user_id")
      .eq("id", parent_id)
      .single();

    if (!parent || parent.user_id !== user.id) {
      return NextResponse.json(
        { error: "Parent page not found or access denied" },
        { status: 403 }
      );
    }
  }

  // Compute position: find the max position among siblings and add 1000.
  const siblingsQuery = supabase
    .from("pages")
    .select("position")
    .eq("user_id", user.id);

  // Filter by parent_id — use .is() for null, .eq() for a string value
  if (parent_id === null) {
    siblingsQuery.is("parent_id", null);
  } else {
    siblingsQuery.eq("parent_id", parent_id);
  }

  const { data: siblings } = await siblingsQuery;

  const position = nextPosition(siblings ?? []);

  const { data, error } = await supabase
    .from("pages")
    .insert({
      user_id: user.id,
      parent_id,
      title,
      position,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
