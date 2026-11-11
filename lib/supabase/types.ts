/**
 * Hand-written database type definitions matching the Supabase schema.
 *
 * These mirror the SQL migrations exactly. If the schema changes,
 * update both the migration files and this file together.
 *
 * Generated types (via `supabase gen types typescript`) can replace this
 * file once the hosted project is configured.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pages_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          id: string;
          page_id: string;
          user_id: string;
          type: string;
          content: Json;
          position: number;
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey";
            columns: ["page_id"];
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      block_type:
        | "paragraph"
        | "heading_1"
        | "heading_2"
        | "bullet_list"
        | "numbered_list"
        | "checkbox";
    };
  };
}
