/**
 * Hand-written database type definitions matching the Supabase schema.
 * Mirrors all SQL migrations 001–008 exactly.
 * Replace with `supabase gen types typescript` output once the CLI is configured.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ────────────────────────────────────────────────────────────────────

export type MemberRole = "admin" | "employee";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type PageVisibility = "personal" | "org";
export type ActivityEntityType =
  | "organization"
  | "project"
  | "task"
  | "member"
  | "invitation"
  | "page"
  | "comment";

// ─── Database interface ───────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {

      // ── organizations ──────────────────────────────────────────────────────
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          owner_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          owner_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          owner_id?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── organization_members ───────────────────────────────────────────────
      organization_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: MemberRole;
          invited_by: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: MemberRole;
          invited_by?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: MemberRole;
          invited_by?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── invitations ────────────────────────────────────────────────────────
      invitations: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: MemberRole;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: MemberRole;
          token?: string;
          invited_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: MemberRole;
          token?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ── projects ───────────────────────────────────────────────────────────
      projects: {
        Row: {
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
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          created_by: string;
          start_date?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          created_by?: string;
          start_date?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── project_members ─────────────────────────────────────────────────
      project_members: {
        Row: { id: string; project_id: string; user_id: string; org_id: string; added_at: string; };
        Insert: { id?: string; project_id: string; user_id: string; org_id: string; added_at?: string; };
        Update: never;
        Relationships: [];
      };

      // ── tasks ──────────────────────────────────────────────────────────────
      tasks: {
        Row: {
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
        };
        Insert: {
          id?: string;
          org_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          creator_id: string;
          assignee_id?: string | null;
          priority?: TaskPriority;
          status?: TaskStatus;
          start_date?: string | null;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          creator_id?: string;
          assignee_id?: string | null;
          priority?: TaskPriority;
          status?: TaskStatus;
          start_date?: string | null;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── task_comments ──────────────────────────────────────────────────────
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          org_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          org_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          org_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── activity_logs ──────────────────────────────────────────────────────
      activity_logs: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          entity_type: ActivityEntityType;
          entity_id: string;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string | null;
          entity_type: ActivityEntityType;
          entity_id: string;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      // ── notifications ──────────────────────────────────────────────────────
      notifications: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ── pages (updated with org_id + visibility) ───────────────────────────
      pages: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_id?: string | null;
          title: string;
          position?: number;
          archived_at?: string | null;
          cover?: string | null;
          icon?: string | null;
          org_id?: string | null;
          visibility?: PageVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parent_id?: string | null;
          title?: string;
          position?: number;
          archived_at?: string | null;
          cover?: string | null;
          icon?: string | null;
          org_id?: string | null;
          visibility?: PageVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── blocks (updated with org_id) ───────────────────────────────────────
      blocks: {
        Row: {
          id: string;
          page_id: string;
          user_id: string;
          type: string;
          content: Json;
          position: number;
          org_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          user_id: string;
          type: string;
          content: Json;
          position?: number;
          org_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          user_id?: string;
          type?: string;
          content?: Json;
          position?: number;
          org_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: {
      get_my_org_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      get_my_role: {
        Args: Record<string, never>;
        Returns: MemberRole | null;
      };
      is_admin_or_owner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };

    Enums: {
      member_role: MemberRole;
      project_status: ProjectStatus;
    };
  };
}
