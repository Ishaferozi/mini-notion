-- =============================================================================
-- Migration 009: Remove owner role — use admin and employee only
-- =============================================================================
-- IMPORTANT: PostgreSQL does not allow removing a value from an existing enum
-- if rows already use that value. So we:
--   1. Convert all 'owner' rows to 'admin' first.
--   2. Replace the is_admin_or_owner() helper with is_admin().
--   3. Drop and recreate all org-scoped RLS policies using is_admin().
--   4. Update the members_update/delete policies to remove owner-specific checks
--      (there is no owner to protect anymore — any admin can be changed by another admin).
--
-- We deliberately do NOT drop the 'owner' value from the enum — PostgreSQL
-- does not support that without recreating the type. The value becomes
-- unused but harmless. All application code and policies use 'admin' instead.
-- =============================================================================


-- ── Step 1: Convert existing 'owner' rows to 'admin' ─────────────────────────

update public.organization_members
  set role = 'admin'
  where role = 'owner';


-- ── Step 2: Replace helper functions ─────────────────────────────────────────

-- Replace is_admin_or_owner() — now checks only 'admin'
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
      and role = 'admin'
  );
$$;

-- Add a cleaner alias used by new code
create or replace function public.is_admin()
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
      and role = 'admin'
  );
$$;


-- ── Step 3: Drop existing org RLS policies (from migration 007) ──────────────

drop policy if exists "orgs_select_member"       on public.organizations;
drop policy if exists "orgs_update_admin"         on public.organizations;
drop policy if exists "members_select_same_org"   on public.organization_members;
drop policy if exists "members_insert_admin"      on public.organization_members;
drop policy if exists "members_update_admin"      on public.organization_members;
drop policy if exists "members_delete_admin"      on public.organization_members;
drop policy if exists "invitations_select_admin"  on public.invitations;
drop policy if exists "invitations_insert_admin"  on public.invitations;
drop policy if exists "invitations_delete_admin"  on public.invitations;
drop policy if exists "projects_select_member"    on public.projects;
drop policy if exists "projects_insert_admin"     on public.projects;
drop policy if exists "projects_update_admin"     on public.projects;
drop policy if exists "projects_delete_admin"     on public.projects;
drop policy if exists "tasks_select_member"       on public.tasks;
drop policy if exists "tasks_insert_member"       on public.tasks;
drop policy if exists "tasks_update_member"       on public.tasks;
drop policy if exists "tasks_delete_admin"        on public.tasks;
drop policy if exists "task_comments_select_member"  on public.task_comments;
drop policy if exists "task_comments_insert_member"  on public.task_comments;
drop policy if exists "task_comments_update_author"  on public.task_comments;
drop policy if exists "task_comments_delete_author"  on public.task_comments;
drop policy if exists "activity_logs_select_member"  on public.activity_logs;
drop policy if exists "notifications_select_own"     on public.notifications;
drop policy if exists "notifications_update_own"     on public.notifications;
drop policy if exists "notifications_delete_own"     on public.notifications;


-- ── Step 4: Recreate all RLS policies with two-role model ─────────────────────

-- organizations ──────────────────────────────────────────────────────────────

create policy "orgs_select_member"
  on public.organizations for select
  using (id = public.get_my_org_id());

-- Only admin can update org settings (no owner concept)
create policy "orgs_update_admin"
  on public.organizations for update
  using  (id = public.get_my_org_id() and public.is_admin())
  with check (id = public.get_my_org_id() and public.is_admin());


-- organization_members ───────────────────────────────────────────────────────

create policy "members_select_same_org"
  on public.organization_members for select
  using (org_id = public.get_my_org_id());

-- Only admin can add members
create policy "members_insert_admin"
  on public.organization_members for insert
  with check (
    org_id = public.get_my_org_id()
    and public.is_admin()
  );

-- Only admin can change roles.
-- Constraint: role must be 'admin' or 'employee' only.
-- An employee can never self-escalate (the USING clause checks the caller is admin).
create policy "members_update_admin"
  on public.organization_members for update
  using  (org_id = public.get_my_org_id() and public.is_admin())
  with check (
    org_id = public.get_my_org_id()
    and public.is_admin()
    and role in ('admin', 'employee')
  );

-- Only admin can remove members. An admin cannot remove themselves
-- (enforced server-side in the API; DB prevents it via the USING clause
-- requiring the caller to be admin, but does not block self-deletion at DB level —
-- that is handled in the route handler).
create policy "members_delete_admin"
  on public.organization_members for delete
  using (
    org_id = public.get_my_org_id()
    and public.is_admin()
  );


-- invitations ────────────────────────────────────────────────────────────────

create policy "invitations_select_admin"
  on public.invitations for select
  using (org_id = public.get_my_org_id() and public.is_admin());

create policy "invitations_insert_admin"
  on public.invitations for insert
  with check (org_id = public.get_my_org_id() and public.is_admin());

create policy "invitations_delete_admin"
  on public.invitations for delete
  using (org_id = public.get_my_org_id() and public.is_admin());


-- projects ───────────────────────────────────────────────────────────────────

create policy "projects_select_member"
  on public.projects for select
  using (org_id = public.get_my_org_id());

create policy "projects_insert_admin"
  on public.projects for insert
  with check (org_id = public.get_my_org_id() and public.is_admin());

create policy "projects_update_admin"
  on public.projects for update
  using  (org_id = public.get_my_org_id() and public.is_admin())
  with check (org_id = public.get_my_org_id() and public.is_admin());

create policy "projects_delete_admin"
  on public.projects for delete
  using (org_id = public.get_my_org_id() and public.is_admin());


-- tasks ──────────────────────────────────────────────────────────────────────

create policy "tasks_select_member"
  on public.tasks for select
  using (org_id = public.get_my_org_id());

create policy "tasks_insert_member"
  on public.tasks for insert
  with check (
    org_id = public.get_my_org_id()
    and creator_id = auth.uid()
  );

-- Creator, assignee, or admin can update
create policy "tasks_update_member"
  on public.tasks for update
  using (
    org_id = public.get_my_org_id()
    and (creator_id = auth.uid() or assignee_id = auth.uid() or public.is_admin())
  )
  with check (org_id = public.get_my_org_id());

-- Admin or creator can delete
create policy "tasks_delete_admin"
  on public.tasks for delete
  using (
    org_id = public.get_my_org_id()
    and (creator_id = auth.uid() or public.is_admin())
  );


-- task_comments ──────────────────────────────────────────────────────────────

create policy "task_comments_select_member"
  on public.task_comments for select
  using (org_id = public.get_my_org_id());

create policy "task_comments_insert_member"
  on public.task_comments for insert
  with check (org_id = public.get_my_org_id() and user_id = auth.uid());

create policy "task_comments_update_author"
  on public.task_comments for update
  using  (org_id = public.get_my_org_id() and user_id = auth.uid())
  with check (org_id = public.get_my_org_id() and user_id = auth.uid());

create policy "task_comments_delete_author"
  on public.task_comments for delete
  using (
    org_id = public.get_my_org_id()
    and (user_id = auth.uid() or public.is_admin())
  );


-- activity_logs ──────────────────────────────────────────────────────────────

-- Only admins can view activity logs
create policy "activity_logs_select_member"
  on public.activity_logs for select
  using (org_id = public.get_my_org_id() and public.is_admin());


-- notifications ──────────────────────────────────────────────────────────────

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_delete_own"
  on public.notifications for delete
  using (user_id = auth.uid());
