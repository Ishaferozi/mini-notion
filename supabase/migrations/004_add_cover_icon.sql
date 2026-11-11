-- =============================================================================
-- Migration 004: add cover and icon columns to pages
-- =============================================================================
-- cover: stores the index (0–7) of the selected gradient, or a custom CSS
--        gradient string. Nullable — null means "use default gradient 0".
-- icon:  stores an emoji character. Nullable — null means "use default 📄".
-- =============================================================================

alter table public.pages
  add column if not exists cover text,
  add column if not exists icon  text;

-- No RLS changes needed — existing policies already cover all columns on pages.
