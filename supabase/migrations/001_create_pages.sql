-- =============================================================================
-- Migration 001: pages table
-- =============================================================================
-- Cascade decision:
--   Archiving a parent page does NOT cascade to children — children remain
--   individually manageable. Hard-deleting a parent sets children's parent_id
--   to NULL (they become root-level pages) rather than deleting them, so no
--   user data is lost silently. This is documented in the README.
-- =============================================================================

create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parent_id   uuid references public.pages(id) on delete set null,
  title       text not null default '' check (char_length(title) <= 500),
  position    numeric not null default 1000,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes for the query patterns we use most
create index if not exists pages_user_id_idx        on public.pages(user_id);
create index if not exists pages_parent_id_idx      on public.pages(parent_id);
create index if not exists pages_user_position_idx  on public.pages(user_id, position);
create index if not exists pages_user_updated_idx   on public.pages(user_id, updated_at desc);
create index if not exists pages_archived_at_idx    on public.pages(archived_at)
  where archived_at is not null;

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- Enable Row Level Security (policies are in 003_rls_policies.sql)
alter table public.pages enable row level security;
