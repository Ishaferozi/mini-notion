import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidBlockType } from "@/lib/types";
import type { TiptapContent } from "@/lib/types";

type RouteContext = { params: Promise<{ pageId: string }> };

// ── GET /api/blocks/[pageId] ──────────────────────────────────────────────────
// Returns all blocks for a page, ordered by position ascending.
// RLS ensures the user owns the page.
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { pageId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify page ownership explicitly for a clear error message.
  const { data: page } = await supabase
    .from("pages")
    .select("id, user_id")
    .eq("id", pageId)
    .single();

  if (!page || page.user_id !== user.id) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

// ── PUT /api/blocks/[pageId] ──────────────────────────────────────────────────
// Full replace: saves the entire Tiptap document as a single block row.
// This is an upsert — if a "document" block already exists for this page,
// it's updated; otherwise a new one is created.
//
// Body: { content: TiptapContent }
//
// Design rationale: storing one Tiptap JSON document per page is simpler than
// one-row-per-block and avoids ordering/race issues during debounced autosave.
// The tradeoff is that partial updates aren't possible, but for a single-user
// workspace this is acceptable and matches how Tiptap serialises its state.
export async function PUT(request: NextRequest, ctx: RouteContext) {
  const { pageId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify page ownership.
  const { data: page } = await supabase
    .from("pages")
    .select("id, user_id")
    .eq("id", pageId)
    .single();

  if (!page || page.user_id !== user.id) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.content || typeof body.content !== "object") {
    return NextResponse.json(
      { error: "content is required and must be a JSON object" },
      { status: 400 }
    );
  }

  // Cast to Json — the database jsonb column accepts any serialisable object.
  // We've already validated it's a non-null object above.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentJson = body.content as any;

  // Check whether a document block already exists for this page.
  const { data: existing } = await supabase
    .from("blocks")
    .select("id")
    .eq("page_id", pageId)
    .eq("type", "document")
    .maybeSingle();

  let result;

  if (existing) {
    // Update existing document block.
    result = await supabase
      .from("blocks")
      .update({ content: contentJson })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    // Insert new document block.
    result = await supabase
      .from("blocks")
      .insert({
        page_id: pageId,
        user_id: user.id,
        type: "document",
        content: contentJson,
        position: 1000,
      })
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

// ── POST /api/blocks/[pageId] ─────────────────────────────────────────────────
// Alias for PUT — both perform an upsert. Kept for semantic completeness.
export const POST = PUT;
