-- =============================================================================
-- Migration 008: add org_id and visibility to pages and blocks
-- =============================================================================
-- Backward compatibility:
--   Existing rows get org_id = NULL and visibility = 'personal'.
--   They continue to work exactly as before under the original RLS policies.
--
-- New org pages get org_id set and visibility = 'org'.
--   Their RLS must check EITHER:
--     a) the page belongs to the authenticated user (personal), OR
--     b) the page belongs to the user's org (org page)
--
-- RLS policy updates:
--   The original policies (003) gated everything on user_id = auth.uid().
--   We drop and replace them here to support both personal and org pages.
-- =============================================================================

-- ── Add columns ───────────────────────────────────────────────────────────────

alter table public.pages
  add column if not exists org_id     uuid references public.organizations(id) on delete cascade,
  add column if not exists visibility text not null default 'personal'
    check (visibility in ('personal', 'org'));

alter table public.blocks
  add column if not exists org_id uuid references public.organizations(id) on delete cascade;

-- Indexes for org-scoped queries
create index if not exists pages_org_id_idx  on public.pages(org_id) where org_id is not null;
create index if not exists blocks_org_id_idx on public.blocks(org_id) where org_id is not null;


-- ── Replace pages RLS policies ────────────────────────────────────────────────

drop policy if exists "pages_select_own"   on public.pages;
drop policy if exists "pages_insert_own"   on public.pages;
drop policy if exists "pages_update_own"   on public.pages;
drop policy if exists "pages_delete_own"   on public.pages;

-- SELECT: own personal page OR org member sees org page
create policy "pages_select_v2"
  on public.pages for select
  using (
    (visibility = 'personal' and user_id = auth.uid())
    or
    (visibility = 'org' and org_id = public.get_my_org_id())
  );

-- INSERT: personal page (own) OR org page (must be member of that org)
create policy "pages_insert_v2"
  on public.pages for insert
  with check (
    (
      visibility = 'personal'
      and user_id = auth.uid()
      and (
        parent_id is null
        or exists (
          select 1 from public.pages p
          where p.id = parent_id
            and p.user_id = auth.uid()
            and p.visibility = 'personal'
        )
      )
    )
    or
    (
      visibility = 'org'
      and org_id = public.get_my_org_id()
      and user_id = auth.uid()
    )
  );

-- UPDATE: personal page (own) OR org page (member of org)
create policy "pages_update_v2"
  on public.pages for update
  using (
    (visibility = 'personal' and user_id = auth.uid())
    or
    (visibility = 'org' and org_id = public.get_my_org_id())
  )
  with check (
    (visibility = 'personal' and user_id = auth.uid())
    or
    (visibility = 'org' and org_id = public.get_my_org_id())
  );

-- DELETE: personal page (own) OR org admin/owner can delete org page
create policy "pages_delete_v2"
  on public.pages for delete
  using (
    (visibility = 'personal' and user_id = auth.uid())
    or
    (visibility = 'org' and org_id = public.get_my_org_id() and public.is_admin_or_owner())
  );


-- ── Replace blocks RLS policies ───────────────────────────────────────────────

drop policy if exists "blocks_select_own"  on public.blocks;
drop policy if exists "blocks_insert_own"  on public.blocks;
drop policy if exists "blocks_update_own"  on public.blocks;
drop policy if exists "blocks_delete_own"  on public.blocks;

-- SELECT: own personal block OR org member block
create policy "blocks_select_v2"
  on public.blocks for select
  using (
    (org_id is null and user_id = auth.uid())
    or
    (org_id is not null and org_id = public.get_my_org_id())
  );

-- INSERT: block must match the page's ownership
create policy "blocks_insert_v2"
  on public.blocks for insert
  with check (
    (
      org_id is null
      and user_id = auth.uid()
      and exists (
        select 1 from public.pages p
        where p.id = page_id
          and p.user_id = auth.uid()
          and p.visibility = 'personal'
      )
    )
    or
    (
      org_id is not null
      and org_id = public.get_my_org_id()
      and exists (
        select 1 from public.pages p
        where p.id = page_id
          and p.org_id = public.get_my_org_id()
          and p.visibility = 'org'
      )
    )
  );

-- UPDATE: own personal block OR org member block
create policy "blocks_update_v2"
  on public.blocks for update
  using (
    (org_id is null and user_id = auth.uid())
    or
    (org_id is not null and org_id = public.get_my_org_id())
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or
    (org_id is not null and org_id = public.get_my_org_id())
  );

-- DELETE: own personal block OR org admin/owner
create policy "blocks_delete_v2"
  on public.blocks for delete
  using (
    (org_id is null and user_id = auth.uid())
    or
    (org_id is not null and org_id = public.get_my_org_id() and public.is_admin_or_owner())
  );
