import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clampTitle, isAncestorOrSelf } from "@/lib/utils";
import type { Page } from "@/lib/types";

type RouteContext = { params: Promise<{ pageId: string }> };

// ── GET /api/pages/[pageId] ───────────────────────────────────────────────────
// Returns a single page. RLS enforces ownership.
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { pageId } = await ctx.params;
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
    .eq("id", pageId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// ── PATCH /api/pages/[pageId] ─────────────────────────────────────────────────
// Updates a page. Allowed fields: title, parent_id, position, archived_at.
// Prevents cycles: cannot set parent_id to a descendant of this page.
export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { pageId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership before reading body (fail fast).
  const { data: existing } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  // ── title ──
  if ("title" in body) {
    if (typeof body.title !== "string") {
      return NextResponse.json({ error: "title must be a string" }, { status: 400 });
    }
    updates.title = clampTitle(body.title.trim());
  }

  // ── position ──
  if ("position" in body) {
    if (typeof body.position !== "number") {
      return NextResponse.json({ error: "position must be a number" }, { status: 400 });
    }
    updates.position = body.position;
  }

  // ── archived_at (archive / restore) ──
  if ("archived_at" in body) {
    updates.archived_at =
      body.archived_at === null ? null : new Date().toISOString();
  }

  // ── cover (gradient index or CSS string) ──
  if ("cover" in body) {
    updates.cover =
      body.cover === null
        ? null
        : typeof body.cover === "string"
        ? body.cover.slice(0, 500)
        : undefined;
    if (updates.cover === undefined) {
      return NextResponse.json({ error: "cover must be a string or null" }, { status: 400 });
    }
  }

  // ── icon (emoji character) ──
  if ("icon" in body) {
    updates.icon =
      body.icon === null
        ? null
        : typeof body.icon === "string"
        ? body.icon.slice(0, 10)
        : undefined;
    if (updates.icon === undefined) {
      return NextResponse.json({ error: "icon must be a string or null" }, { status: 400 });
    }
  }

  // ── parent_id ──
  if ("parent_id" in body) {
    const newParentId =
      body.parent_id === null
        ? null
        : typeof body.parent_id === "string"
        ? body.parent_id.trim()
        : null;

    if (newParentId !== null) {
      // Cannot set page as its own parent.
      if (newParentId === pageId) {
        return NextResponse.json(
          { error: "A page cannot be its own parent" },
          { status: 400 }
        );
      }

      // Verify parent belongs to this user.
      const { data: parent } = await supabase
        .from("pages")
        .select("id, user_id")
        .eq("id", newParentId)
        .single();

      if (!parent || parent.user_id !== user.id) {
        return NextResponse.json(
          { error: "Parent page not found or access denied" },
          { status: 403 }
        );
      }

      // Cycle prevention: fetch all pages to walk the descendant tree.
      const { data: allPages } = await supabase
        .from("pages")
        .select("id, parent_id, user_id, title, position, archived_at, created_at, updated_at")
        .eq("user_id", user.id);

      if (isAncestorOrSelf(newParentId, pageId, (allPages ?? []) as Page[])) {
        return NextResponse.json(
          { error: "Cannot move a page beneath its own descendant" },
          { status: 400 }
        );
      }
    }

    updates.parent_id = newParentId;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ data: existing });
  }

  const { data, error } = await supabase
    .from("pages")
    // Cast through unknown to satisfy Supabase's strict RejectExcessProperties
    // constraint — updates is a subset of the row's Update type, built
    // conditionally above with only valid column keys.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updates as any)
    .eq("id", pageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ── DELETE /api/pages/[pageId] ────────────────────────────────────────────────
// Hard-deletes a page. Children's parent_id becomes NULL (they become root
// pages) due to the ON DELETE SET NULL constraint — no data is lost silently.
// Blocks are cascade-deleted by the database.
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { pageId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS enforces ownership, but we also check explicitly for a clear 404.
  const { data: existing } = await supabase
    .from("pages")
    .select("id, user_id")
    .eq("id", pageId)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
