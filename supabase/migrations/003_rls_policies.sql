-- =============================================================================
-- Migration 003: Row Level Security policies
-- =============================================================================
-- Every policy restricts rows to auth.uid() = user_id.
-- This means even a direct database/API request with a valid JWT for User A
-- cannot read, modify, or delete User B's data — the database enforces it.
--
-- Parent ownership check: when inserting/updating a page with a parent_id,
-- a subquery verifies the parent also belongs to the same user. This prevents
-- a user from attaching their page under another user's page hierarchy.
-- =============================================================================

-- ── pages ────────────────────────────────────────────────────────────────────

-- SELECT: users see only their own pages
create policy "pages_select_own"
  on public.pages for select
  using (auth.uid() = user_id);

-- INSERT: users can only insert pages they own; parent must also be theirs
create policy "pages_insert_own"
  on public.pages for insert
  with check (
    auth.uid() = user_id
    and (
      parent_id is null
      or exists (
        select 1 from public.pages p
        where p.id = parent_id
          and p.user_id = auth.uid()
      )
    )
  );

-- UPDATE: users can only update their own pages; parent must still be theirs
create policy "pages_update_own"
  on public.pages for update
  using  (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      parent_id is null
      or exists (
        select 1 from public.pages p
        where p.id = parent_id
          and p.user_id = auth.uid()
      )
    )
  );

-- DELETE: users can only delete their own pages
create policy "pages_delete_own"
  on public.pages for delete
  using (auth.uid() = user_id);


-- ── blocks ───────────────────────────────────────────────────────────────────

-- SELECT: users see only blocks on their own pages
create policy "blocks_select_own"
  on public.blocks for select
  using (auth.uid() = user_id);

-- INSERT: block must belong to the authenticated user AND the page must too
create policy "blocks_insert_own"
  on public.blocks for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  );

-- UPDATE: users can only update blocks they own
create policy "blocks_update_own"
  on public.blocks for update
  using  (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  );

-- DELETE: users can only delete their own blocks
create policy "blocks_delete_own"
  on public.blocks for delete
  using (auth.uid() = user_id);
