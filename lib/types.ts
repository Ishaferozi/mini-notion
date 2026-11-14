/**
 * Application-layer domain types.
 * These are the shapes used by UI components, server actions, and route
 * handlers — derived from (but not identical to) the raw DB row types.
 */

import type {
  MemberRole,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  PageVisibility,
  ActivityEntityType,
} from "./supabase/types";

// Re-export enums so consumers only import from one place
export type {
  MemberRole,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  PageVisibility,
  ActivityEntityType,
};

// ─── Block Types ──────────────────────────────────────────────────────────────

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

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Member ───────────────────────────────────────────────────────────────────

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Member enriched with Supabase auth user data (email, display name).
 * Used in the Admin Members panel.
 */
export interface OrgMemberWithUser extends OrgMember {
  email: string;
  display_name: string | null;
}

// ─── Invitation ───────────────────────────────────────────────────────────────

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: MemberRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export type InvitationStatus = "pending" | "accepted" | "expired";

export function getInvitationStatus(inv: Invitation): InvitationStatus {
  if (inv.accepted_at) return "accepted";
  if (new Date(inv.expires_at) < new Date()) return "expired";
  return "pending";
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_by: string;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  org_id: string;
  project_id: string;
  title: string;
  description: string | null;
  creator_id: string;
  assignee_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithMeta extends Task {
  project_name: string;
  assignee_email: string | null;
  assignee_name: string | null;
  creator_email: string;
}

// ─── Task Comment ─────────────────────────────────────────────────────────────

export interface TaskComment {
  id: string;
  task_id: string;
  org_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCommentWithUser extends TaskComment {
  user_email: string;
  user_name: string | null;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  org_id: string;
  user_id: string | null;
  entity_type: ActivityEntityType;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  org_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// ─── Page (updated) ───────────────────────────────────────────────────────────

export interface Page {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  position: number;
  archived_at: string | null;
  cover: string | null;
  icon: string | null;
  org_id: string | null;
  visibility: PageVisibility;
  created_at: string;
  updated_at: string;
}

export interface PageNode extends Page {
  children: PageNode[];
}

// ─── Block ────────────────────────────────────────────────────────────────────

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
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Auth context ─────────────────────────────────────────────────────────────

/**
 * The resolved auth context available in every server component and handler.
 * Returned by getCurrentMember() in lib/auth.ts.
 */
export interface AuthContext {
  userId: string;
  email: string;
  orgId: string;
  role: MemberRole;
  org: Organization;
}

// ─── Save Status ──────────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── API helpers ──────────────────────────────────────────────────────────────

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

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "completed"];
export const PROJECT_STATUSES: ProjectStatus[] = ["active", "on_hold", "completed", "archived"];
export const MEMBER_ROLES: MemberRole[] = ["admin", "employee"];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  employee: "Employee",
};
