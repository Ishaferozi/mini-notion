-- =============================================================================
-- Migration 002: blocks table
-- =============================================================================
-- Design: one row per page stores the full Tiptap JSON document.
-- type is constrained to the enum values recognised by the editor.
-- Cascade decision:
--   Hard-deleting a page cascades to its blocks (no orphaned block data).
-- =============================================================================

create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in (
               'paragraph',
               'heading_1',
               'heading_2',
               'bullet_list',
               'numbered_list',
               'checkbox',
               'document'   -- full Tiptap JSON document blob
             )),
  content    jsonb not null default '{}',
  position   numeric not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists blocks_page_id_idx          on public.blocks(page_id);
create index if not exists blocks_user_id_idx          on public.blocks(user_id);
create index if not exists blocks_page_position_idx    on public.blocks(page_id, position);

-- Reuse the same updated_at trigger function created in migration 001
create or replace trigger blocks_set_updated_at
  before update on public.blocks
  for each row execute function public.set_updated_at();

-- Enable Row Level Security
alter table public.blocks enable row level security;
