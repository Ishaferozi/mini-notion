/**
 * Shared domain types used across server and client code.
 *
 * These are derived from the database row types but shaped for use in
 * the application layer — UI components, server actions, and route handlers
 * all consume these types rather than raw database rows.
 */

// ─── Block Types ─────────────────────────────────────────────────────────────

/**
 * Valid block types for the editor.
 * Matches the `block_type` enum in the database and the CHECK constraint
 * on the blocks table.
 */
export type BlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "bullet_list"
  | "numbered_list"
  | "checkbox";

export const BLOCK_TYPES: BlockType[] = [
  "paragraph",
  "heading_1",
  "heading_2",
  "bullet_list",
  "numbered_list",
  "checkbox",
];

export function isValidBlockType(value: unknown): value is BlockType {
  return BLOCK_TYPES.includes(value as BlockType);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export interface Page {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  position: number;
  archived_at: string | null;
  cover: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A page augmented with its loaded children — used to build the sidebar tree.
 * Children are sorted by position ascending.
 */
export interface PageNode extends Page {
  children: PageNode[];
}

// ─── Block ───────────────────────────────────────────────────────────────────

/**
 * The JSON content stored in blocks.content.
 * This is the Tiptap JSON document format.
 */
export interface TiptapContent {
  type: string;
  content?: TiptapContent[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

export interface Block {
  id: string;
  page_id: string;
  user_id: string;
  type: BlockType;
  content: TiptapContent;
  position: number;
  created_at: string;
  updated_at: string;
}

// ─── Save Status ──────────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  id: string;
  title: string;
}
