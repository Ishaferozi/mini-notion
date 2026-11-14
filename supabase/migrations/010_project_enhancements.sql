-- =============================================================================
-- Migration 010: Add start_date, due_date to projects
--                Add project_members junction table
-- =============================================================================

-- Add date fields to projects
alter table public.projects
  add column if not exists start_date date,
  add column if not exists due_date   date;

-- project_members: tracks which org members are assigned to a project
create table if not exists public.project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  added_at   timestamptz not null default now(),
  constraint project_members_unique unique (project_id, user_id)
);

create index if not exists pm_project_id_idx on public.project_members(project_id);
create index if not exists pm_user_id_idx    on public.project_members(user_id);
create index if not exists pm_org_id_idx     on public.project_members(org_id);

alter table public.project_members enable row level security;

-- RLS: all org members can see project members
create policy "pm_select_member"
  on public.project_members for select
  using (org_id = public.get_my_org_id());

-- Only admins can add/remove project members
create policy "pm_insert_admin"
  on public.project_members for insert
  with check (org_id = public.get_my_org_id() and public.is_admin());

create policy "pm_delete_admin"
  on public.project_members for delete
  using (org_id = public.get_my_org_id() and public.is_admin());
