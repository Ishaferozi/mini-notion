-- =============================================================================
-- Migration 005: organizations, organization_members, invitations
-- =============================================================================
-- Design decisions:
--   - One org per user: a user can be a member of exactly one organization.
--     Enforced by a unique index on organization_members(user_id).
--   - Roles: owner | admin | employee. Only one owner per org.
--     Owner is set server-side during org creation — never self-assigned.
--   - Invitations are token-based (UUID), expire after 7 days, single-use.
--   - Soft-delete: orgs are never hard-deleted (archived_at instead).
-- =============================================================================

-- ── organizations ─────────────────────────────────────────────────────────────

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) >= 2 and char_length(name) <= 100),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,50}$'),
  logo_url    text,
  owner_id    uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists orgs_owner_id_idx on public.organizations(owner_id);
create index if not exists orgs_slug_idx     on public.organizations(slug);

create or replace trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;


-- ── organization_members ──────────────────────────────────────────────────────

create type if not exists public.member_role as enum ('owner', 'admin', 'employee');

create table if not exists public.organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.member_role not null default 'employee',
  invited_by  uuid references auth.users(id) on delete set null,
  joined_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One org per user — enforced at DB level
  constraint organization_members_user_unique unique (user_id)
);

create index if not exists members_org_id_idx  on public.organization_members(org_id);
create index if not exists members_user_id_idx on public.organization_members(user_id);
create index if not exists members_role_idx    on public.organization_members(org_id, role);

create or replace trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

alter table public.organization_members enable row level security;


-- ── invitations ───────────────────────────────────────────────────────────────

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null check (char_length(email) <= 320),
  role        public.member_role not null default 'employee',
  token       uuid not null default gen_random_uuid() unique,
  invited_by  uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),

  -- Prevent duplicate pending invitations for the same email+org
  constraint invitations_email_org_unique unique (email, org_id)
);

create index if not exists invitations_org_id_idx on public.invitations(org_id);
create index if not exists invitations_email_idx  on public.invitations(email);
create index if not exists invitations_token_idx  on public.invitations(token);

alter table public.invitations enable row level security;


-- ── Helper: get current user's org_id ────────────────────────────────────────
-- Used inside RLS policies to avoid repeated subqueries.

create or replace function public.get_my_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.organization_members
  where user_id = auth.uid()
  limit 1;
$$;


-- ── Helper: get current user's role in their org ──────────────────────────────

create or replace function public.get_my_role()
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where user_id = auth.uid()
  limit 1;
$$;


-- ── Helper: check if current user is admin or owner ───────────────────────────

create or replace function public.is_admin_or_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;
