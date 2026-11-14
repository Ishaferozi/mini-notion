-- =============================================================================
-- Migration 007: RLS policies for all org-scoped tables
-- =============================================================================
-- Core principle:
--   Every row is restricted to members of the same organization.
--   get_my_org_id() and is_admin_or_owner() are security-definer helpers
--   defined in migration 005 — they avoid repeated subqueries in every policy.
--
-- Role matrix:
--   organizations    → members: SELECT; owner/admin: UPDATE
--   org_members      → members: SELECT own row + same org; owner/admin: INSERT/UPDATE/DELETE
--   invitations      → owner/admin: all; employee: SELECT own email only
--   projects         → members: SELECT; owner/admin: INSERT/UPDATE/DELETE
--   tasks            → members: SELECT + INSERT; assignee/creator: UPDATE; owner/admin: DELETE
--   task_comments    → members: SELECT + INSERT; author: UPDATE/DELETE
--   activity_logs    → members: SELECT; INSERT via server only (no client INSERT policy)
--   notifications    → user sees only their own; server inserts
-- =============================================================================


-- ── organizations ─────────────────────────────────────────────────────────────

-- Any org member can read their organization
create policy "orgs_select_member"
  on public.organizations for select
  using (id = public.get_my_org_id());

-- Only owner or admin can update org settings
create policy "orgs_update_admin"
  on public.organizations for update
  using  (id = public.get_my_org_id() and public.is_admin_or_owner())
  with check (id = public.get_my_org_id() and public.is_admin_or_owner());

-- INSERT is handled server-side via service role during org creation — no client policy needed


-- ── organization_members ──────────────────────────────────────────────────────

-- Any member can see all members in their org
create policy "members_select_same_org"
  on public.organization_members for select
  using (org_id = public.get_my_org_id());

-- Only admin/owner can add new members (via invitation acceptance handled server-side)
create policy "members_insert_admin"
  on public.organization_members for insert
  with check (
    org_id = public.get_my_org_id()
    and public.is_admin_or_owner()
  );

-- Admin/owner can update roles, except no one can self-escalate to owner
create policy "members_update_admin"
  on public.organization_members for update
  using  (org_id = public.get_my_org_id() and public.is_admin_or_owner())
  with check (
    org_id = public.get_my_org_id()
    and public.is_admin_or_owner()
    -- Prevent escalating anyone to owner via client
    and role != 'owner'
  );

-- Admin/owner can remove members (not the owner themselves)
create policy "members_delete_admin"
  on public.organization_members for delete
  using (
    org_id = public.get_my_org_id()
    and public.is_admin_or_owner()
    and role != 'owner'
  );


-- ── invitations ───────────────────────────────────────────────────────────────

-- Admin/owner can see all invitations for their org
create policy "invitations_select_admin"
  on public.invitations for select
  using (
    org_id = public.get_my_org_id()
    and public.is_admin_or_owner()
  );

-- Unauthenticated users can read their invitation by token
-- (checked server-side via service role — no anonymous RLS policy needed)

-- Admin/owner can create invitations
create policy "invitations_insert_admin"
  on public.invitations for insert
  with check (
    org_id = public.get_my_org_id()
    and public.is_admin_or_owner()
  );

-- Admin/owner can delete (revoke) invitations
create policy "invitations_delete_admin"
  on public.invitations for delete
  using (
    org_id = public.get_my_org_id()
    and public.is_admin_or_owner()
  );


-- ── projects ──────────────────────────────────────────────────────────────────

-- All org members can view projects
create policy "projects_select_member"
  on public.projects for select
  using (org_id = public.get_my_org_id());

-- Only admin/owner can create projects
create policy "projects_insert_admin"
  on public.projects for insert
  with check (
    org_id = public.get_my_org_id()
    and public.is_admin_or_owner()
  );

-- Only admin/owner can update projects
create policy "projects_update_admin"
  on public.projects for update
  using  (org_id = public.get_my_org_id() and public.is_admin_or_owner())
  with check (org_id = public.get_my_org_id() and public.is_admin_or_owner());

-- Only admin/owner can delete projects
create policy "projects_delete_admin"
  on public.projects for delete
  using (org_id = public.get_my_org_id() and public.is_admin_or_owner());


-- ── tasks ─────────────────────────────────────────────────────────────────────

-- All org members can view tasks
create policy "tasks_select_member"
  on public.tasks for select
  using (org_id = public.get_my_org_id());

-- Any member can create tasks
create policy "tasks_insert_member"
  on public.tasks for insert
  with check (
    org_id = public.get_my_org_id()
    and creator_id = auth.uid()
  );

-- Creator, assignee, or admin/owner can update a task
create policy "tasks_update_member"
  on public.tasks for update
  using (
    org_id = public.get_my_org_id()
    and (
      creator_id = auth.uid()
      or assignee_id = auth.uid()
      or public.is_admin_or_owner()
    )
  )
  with check (org_id = public.get_my_org_id());

-- Only admin/owner or creator can delete a task
create policy "tasks_delete_admin"
  on public.tasks for delete
  using (
    org_id = public.get_my_org_id()
    and (creator_id = auth.uid() or public.is_admin_or_owner())
  );


-- ── task_comments ─────────────────────────────────────────────────────────────

-- All org members can view comments
create policy "task_comments_select_member"
  on public.task_comments for select
  using (org_id = public.get_my_org_id());

-- Any member can add a comment
create policy "task_comments_insert_member"
  on public.task_comments for insert
  with check (
    org_id = public.get_my_org_id()
    and user_id = auth.uid()
  );

-- Only the author can edit their comment
create policy "task_comments_update_author"
  on public.task_comments for update
  using  (org_id = public.get_my_org_id() and user_id = auth.uid())
  with check (org_id = public.get_my_org_id() and user_id = auth.uid());

-- Author or admin/owner can delete a comment
create policy "task_comments_delete_author"
  on public.task_comments for delete
  using (
    org_id = public.get_my_org_id()
    and (user_id = auth.uid() or public.is_admin_or_owner())
  );


-- ── activity_logs ─────────────────────────────────────────────────────────────

-- All org members can read activity logs (audit trail)
create policy "activity_logs_select_member"
  on public.activity_logs for select
  using (org_id = public.get_my_org_id());

-- No client INSERT/UPDATE/DELETE — logs are written via server-side service role only


-- ── notifications ─────────────────────────────────────────────────────────────

-- Users see only their own notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

-- Users can mark their own notifications as read (UPDATE read_at)
create policy "notifications_update_own"
  on public.notifications for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own notifications
create policy "notifications_delete_own"
  on public.notifications for delete
  using (user_id = auth.uid());

-- No client INSERT — notifications are created server-side only
