/**
 * Centralized permission checks — two roles: admin | employee.
 * Pure functions — no network calls, no redirects.
 */

import type { MemberRole, Task, TaskComment, Page } from "@/lib/types";

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<MemberRole, number> = {
  admin: 2,
  employee: 1,
};

export function hasMinimumRole(userRole: MemberRole, requiredRole: MemberRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

export function isAdmin(role: MemberRole): boolean {
  return role === "admin";
}

// Keep this alias so existing call-sites using isAdminOrOwner() still compile
export const isAdminOrOwner = isAdmin;

// ─── Organization ─────────────────────────────────────────────────────────────

export const OrgPermissions = {
  canUpdateSettings: (role: MemberRole) => isAdmin(role),
  canViewOrg: (_role: MemberRole) => true,
  /** Any admin can delete/archive the org */
  canDeleteOrg: (role: MemberRole) => isAdmin(role),
} as const;

// ─── Members ──────────────────────────────────────────────────────────────────

export const MemberPermissions = {
  canViewMembers: (_role: MemberRole) => true,
  canInvite: (role: MemberRole) => isAdmin(role),
  /** Admin can change any member's role to admin or employee */
  canChangeRole: (actorRole: MemberRole) => isAdmin(actorRole),
  /** Admin can remove any member; cannot remove themselves (enforced server-side) */
  canRemoveMember: (actorRole: MemberRole) => isAdmin(actorRole),
  canRevokeInvitation: (role: MemberRole) => isAdmin(role),
} as const;

// ─── Projects ─────────────────────────────────────────────────────────────────

export const ProjectPermissions = {
  canView: (_role: MemberRole) => true,
  canCreate: (role: MemberRole) => isAdmin(role),
  canUpdate: (role: MemberRole) => isAdmin(role),
  canDelete: (role: MemberRole) => isAdmin(role),
  canChangeStatus: (role: MemberRole) => isAdmin(role),
} as const;

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const TaskPermissions = {
  canView: (_role: MemberRole) => true,
  canCreate: (_role: MemberRole) => true,

  canUpdate: (
    role: MemberRole,
    task: Pick<Task, "creator_id" | "assignee_id">,
    userId: string
  ) => isAdmin(role) || task.creator_id === userId || task.assignee_id === userId,

  canDelete: (
    role: MemberRole,
    task: Pick<Task, "creator_id">,
    userId: string
  ) => isAdmin(role) || task.creator_id === userId,

  canAssign: (_role: MemberRole) => true,

  canChangeStatus: (
    role: MemberRole,
    task: Pick<Task, "creator_id" | "assignee_id">,
    userId: string
  ) => isAdmin(role) || task.creator_id === userId || task.assignee_id === userId,
} as const;

// ─── Comments ─────────────────────────────────────────────────────────────────

export const CommentPermissions = {
  canView: (_role: MemberRole) => true,
  canCreate: (_role: MemberRole) => true,

  canEdit: (
    role: MemberRole,
    comment: Pick<TaskComment, "user_id">,
    userId: string
  ) => isAdmin(role) || comment.user_id === userId,

  canDelete: (
    role: MemberRole,
    comment: Pick<TaskComment, "user_id">,
    userId: string
  ) => isAdmin(role) || comment.user_id === userId,
} as const;

// ─── Pages ────────────────────────────────────────────────────────────────────

export const PagePermissions = {
  canViewPersonal: (page: Pick<Page, "user_id">, userId: string) =>
    page.user_id === userId,
  canViewOrg: (_role: MemberRole) => true,
  canEditOrg: (_role: MemberRole) => true,
  canDeleteOrg: (role: MemberRole) => isAdmin(role),
} as const;

// ─── Activity / Notifications ─────────────────────────────────────────────────

export const ActivityPermissions = {
  canViewLogs: (role: MemberRole) => isAdmin(role),
} as const;

export const NotificationPermissions = {
  canView: (n: { user_id: string }, userId: string) => n.user_id === userId,
  canMarkRead: (n: { user_id: string }, userId: string) => n.user_id === userId,
} as const;
