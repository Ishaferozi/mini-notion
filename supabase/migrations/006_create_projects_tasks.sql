-- =============================================================================
-- Migration 006: projects, tasks, task_comments
-- =============================================================================
-- Design decisions:
--   - Projects and tasks are org-scoped (org_id FK).
--   - Tasks belong to a project; a task without a project is not allowed.
--   - Cascade: deleting a project cascades to its tasks and their comments.
--   - Priority and status use constrained text (CHECK) rather than enums
--     so values can be extended without a schema migration.
--   - All tables use the shared set_updated_at() trigger from migration 001.
-- =============================================================================

-- ── project_status type ───────────────────────────────────────────────────────

create type if not exists public.project_status as enum (
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- ── projects ──────────────────────────────────────────────────────────────────

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null check (char_length(name) >= 1 and char_length(name) <= 200),
  description text check (char_length(description) <= 2000),
  status      public.project_status not null default 'active',
  created_by  uuid not null references auth.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_org_id_idx        on public.projects(org_id);
create index if not exists projects_created_by_idx    on public.projects(created_by);
create index if not exists projects_org_status_idx    on public.projects(org_id, status);

create or replace trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;


-- ── tasks ─────────────────────────────────────────────────────────────────────

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (char_length(title) >= 1 and char_length(title) <= 500),
  description text check (char_length(description) <= 10000),
  creator_id  uuid not null references auth.users(id) on delete restrict,
  assignee_id uuid references auth.users(id) on delete set null,
  priority    text not null default 'medium'
                check (priority in ('low', 'medium', 'high', 'urgent')),
  status      text not null default 'todo'
                check (status in ('todo', 'in_progress', 'completed')),
  start_date  date,
  due_date    date,
  position    numeric not null default 1000,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- due_date must be on or after start_date when both are set
  constraint tasks_dates_valid check (
    start_date is null or due_date is null or due_date >= start_date
  )
);

create index if not exists tasks_org_id_idx        on public.tasks(org_id);
create index if not exists tasks_project_id_idx    on public.tasks(project_id);
create index if not exists tasks_assignee_id_idx   on public.tasks(assignee_id);
create index if not exists tasks_creator_id_idx    on public.tasks(creator_id);
create index if not exists tasks_status_idx        on public.tasks(org_id, status);
create index if not exists tasks_priority_idx      on public.tasks(org_id, priority);
create index if not exists tasks_due_date_idx      on public.tasks(due_date)
  where due_date is not null;
create index if not exists tasks_project_pos_idx   on public.tasks(project_id, position);

create or replace trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;


-- ── task_comments ─────────────────────────────────────────────────────────────

create table if not exists public.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null check (char_length(content) >= 1 and char_length(content) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_comments_task_id_idx on public.task_comments(task_id);
create index if not exists task_comments_org_id_idx  on public.task_comments(org_id);
create index if not exists task_comments_user_id_idx on public.task_comments(user_id);

create or replace trigger task_comments_set_updated_at
  before update on public.task_comments
  for each row execute function public.set_updated_at();

alter table public.task_comments enable row level security;


-- ── activity_logs ─────────────────────────────────────────────────────────────
-- Append-only audit log. No updates or deletes allowed (enforced by RLS).

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in (
                 'organization', 'project', 'task', 'member',
                 'invitation', 'page', 'comment'
               )),
  entity_id   uuid not null,
  action      text not null check (char_length(action) <= 100),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists activity_logs_org_id_idx     on public.activity_logs(org_id);
create index if not exists activity_logs_user_id_idx    on public.activity_logs(user_id);
create index if not exists activity_logs_entity_idx     on public.activity_logs(entity_type, entity_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs(org_id, created_at desc);

alter table public.activity_logs enable row level security;


-- ── notifications ─────────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (char_length(type) <= 100),
  title      text not null check (char_length(title) <= 300),
  body       text check (char_length(body) <= 1000),
  link       text check (char_length(link) <= 500),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx  on public.notifications(user_id);
create index if not exists notifications_org_id_idx   on public.notifications(org_id);
create index if not exists notifications_unread_idx   on public.notifications(user_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;
