# Mini Notion

A lightweight Notion-inspired workspace where authenticated users can organize nested pages and edit structured content blocks. Built as a full-stack technical assessment demonstrating secure data access, clean architecture, and reliable editor persistence.

---

## Live Demo

> Deploy URL goes here after Vercel deployment.

**Test credentials:** Use the self-registration flow at `/signup` — no pre-created test accounts needed.

---

## Features

- **Authentication** — email/password sign-up, sign-in, sign-out via Supabase Auth
- **Private workspaces** — each user sees only their own pages; enforced at the database level with RLS
- **Nested pages** — parent/child hierarchy up to any depth, collapsible sidebar tree
- **Page management** — create, rename (inline), archive, restore, permanently delete
- **Breadcrumb navigation** — always shows the full ancestor chain
- **Block editor** — Tiptap-powered editor with H1, H2, Paragraph, Bullet list, Numbered list, Checkbox/Task list, Bold, Italic
- **Debounced autosave** — saves block content and page titles 800ms/600ms after typing stops
- **Save status indicator** — Saving… / Saved / Save failed states
- **Search** — filter pages by title with keyboard navigation (↑↓ Enter Escape)
- **Responsive layout** — collapsible sidebar on desktop, drawer on mobile
- **Error & loading states** — boundary components for all failure paths

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4.6 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Auth & DB | Supabase Auth + PostgreSQL |
| Security | Row Level Security (RLS) on all user-owned tables |
| Editor | Tiptap 3 |
| Styling | Tailwind CSS 4 |
| Deployment | Vercel |

---

## Installation

### Prerequisites

- Node.js 22+
- A [Supabase](https://supabase.com) project (free tier works)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd mini-notion

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
# Fill in your Supabase values (see Environment Variables below)

# 4. Run SQL migrations (see Database Setup below)

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register an account.

---

## Environment Variables

Create a `.env.local` file at the project root with the following variables.
**Never commit this file — it is in `.gitignore`.**

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API → `anon` public key |

> **Security note:** Only the `anon` (publishable) key is used in the client. The `service_role` key is never referenced anywhere in this codebase.

---

## Database Setup

Run the three migration files against your Supabase project using the SQL Editor
(**Dashboard → SQL Editor → New query**). Run them in order:

| Order | File | What it creates |
|---|---|---|
| 1 | `supabase/migrations/001_create_pages.sql` | `pages` table, indexes, `updated_at` trigger, RLS enabled |
| 2 | `supabase/migrations/002_create_blocks.sql` | `blocks` table, indexes, same trigger, RLS enabled |
| 3 | `supabase/migrations/003_rls_policies.sql` | SELECT / INSERT / UPDATE / DELETE policies for both tables |

Also in Supabase Dashboard → **Authentication → Providers → Email**:
- Enable the Email provider
- Disable **"Confirm email"** (unless you configure an SMTP provider)

### Schema

```
pages
  id          uuid PK
  user_id     uuid FK → auth.users (cascade delete)
  parent_id   uuid FK → pages (set null on delete)
  title       text (max 500 chars)
  position    numeric
  archived_at timestamptz (null = active)
  created_at  timestamptz
  updated_at  timestamptz (auto-updated by trigger)

blocks
  id          uuid PK
  page_id     uuid FK → pages (cascade delete)
  user_id     uuid FK → auth.users (cascade delete)
  type        text CHECK (paragraph | heading_1 | heading_2 | bullet_list | numbered_list | checkbox | document)
  content     jsonb (Tiptap JSON document)
  position    numeric
  created_at  timestamptz
  updated_at  timestamptz (auto-updated by trigger)
```

---

## Architecture

```
mini-notion/
├── app/
│   ├── (auth)/              # Login + signup pages (static, no sidebar)
│   ├── (workspace)/         # Authenticated shell (sidebar + main area)
│   │   ├── layout.tsx       # Streams sidebar via Suspense
│   │   ├── page.tsx         # Redirects to most recent page or empty state
│   │   ├── loading.tsx      # Suspense fallback for workspace routes
│   │   ├── error.tsx        # Error boundary for workspace
│   │   └── pages/[pageId]/  # Page editor view
│   ├── api/
│   │   ├── pages/           # GET list, POST create
│   │   ├── pages/[pageId]/  # GET, PATCH, DELETE
│   │   └── blocks/[pageId]/ # GET, PUT (upsert Tiptap document)
│   ├── global-error.tsx     # Root-level error boundary
│   └── layout.tsx           # Root layout (fonts, html/body)
├── components/
│   ├── editor/              # Tiptap editor, toolbar, save status
│   └── sidebar/             # Sidebar, page tree, search, page actions
├── lib/
│   ├── supabase/            # Server + browser Supabase clients, DB types
│   ├── types.ts             # Domain types (Page, Block, BlockType, etc.)
│   └── utils.ts             # buildPageTree, getAncestors, debounce, etc.
├── supabase/migrations/     # SQL migration files
└── proxy.ts                 # Next.js 16 auth guard (renamed from middleware.ts)
```

### Key architectural decisions

**Tiptap for the editor**
Tiptap serialises to/from JSON natively, which maps directly to the `content jsonb` column. Building an equivalent custom editor within the assessment time budget would crowd out the security and navigation work. Trade-off: the data model is coupled to Tiptap's JSON schema, but it's well-documented and stable.

**One block row per page ("document" type)**
Each page stores a single Tiptap JSON document blob as one `blocks` row (type = `"document"`). This is simpler than one-row-per-block and avoids ordering/race conditions during debounced autosave. For a single-user workspace this is the right trade-off. A one-row-per-block model would be needed for real-time collaboration or per-block granular history.

**Server Actions vs Route Handlers**
Mutations that require immediate navigation feedback (create page → navigate) use Route Handlers so the client can read the new page ID from the JSON response. The editor autosave also uses a Route Handler (`PUT /api/blocks/[pageId]`) so it can run independently of React's render cycle. `getUser()` is called in every handler — never `getSession()`.

**Cascade vs soft-delete**
- Archiving a page is a soft-delete (`archived_at` timestamp). Children are not affected — they remain individually manageable.
- Hard-deleting a page sets children's `parent_id` to NULL (they become root pages) due to `ON DELETE SET NULL`. No child data is lost silently.
- Hard-deleting a page cascades to its blocks via `ON DELETE CASCADE`. Block data has no value without its page.

**Cycle prevention**
When setting a `parent_id`, the server walks the descendant tree of the target parent and rejects the move if the page being moved appears in that tree. This is O(depth) and correct for ≤100 levels. For 100,000+ pages a closure table or ltree extension would be more efficient.

**Next.js 16 specific**
This project targets Next.js 16.4.6 which has breaking changes from earlier versions:
- `middleware.ts` is deprecated and renamed to `proxy.ts` (export renamed from `middleware()` to `proxy()`)
- `params` and `searchParams` are `Promise`s that must be awaited
- `export const dynamic` is incompatible with `cacheComponents: true` — use `Suspense` + `connection()` instead
- `setContent()` second argument is now `SetContentOptions` object, not a boolean

---

## Security

- **RLS on every table** — `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies all check `auth.uid() = user_id`. A valid JWT for User A cannot read or modify User B's data even via direct SQL or API calls.
- **Parent ownership check** — `INSERT`/`UPDATE` policies verify that `parent_id` (when set) also belongs to the same user, preventing cross-user page hierarchy attacks.
- **Server-side auth in every handler** — every Route Handler calls `supabase.auth.getUser()` before any query. The proxy guard is a convenience layer, not the sole defense.
- **No service-role key** — the service-role key appears nowhere in this codebase. Only the `anon` key is used.
- **Input validation** — title length capped at 500 characters, block type validated against a CHECK constraint in the database, parent references validated for ownership and cycles.

### Demonstrating cross-user isolation

1. Register as User A, create a page, note its URL (`/pages/<uuid>`)
2. Open an incognito window, register as User B
3. Paste User A's page URL — you will see a 404 (RLS returns no rows, `notFound()` is called)
4. Try `GET /api/pages/<user-a-page-id>` with User B's session cookie — returns `{"error":"Page not found"}` with status 404

---

## Trade-offs and Limitations

| Area | Current behaviour | What production would need |
|---|---|---|
| Block storage | Single JSON blob per page | One row per block for collaboration / granular history |
| Page ordering | Float `position` with 1000-unit gaps | LexoRank or fractional indexing for drag-and-drop |
| Cycle detection | O(depth) ancestor walk | Closure table or PostgreSQL `ltree` for large trees |
| Search | Client-side `includes()` filter | Supabase `ilike` or `pg_trgm` full-text search |
| Realtime | None | Supabase Realtime channels + CRDT for collaboration |
| Offline | None | Service worker + IndexedDB draft queue |

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Or connect your GitHub repository in the Vercel dashboard and it will auto-deploy on push.

**After deploying**, add your Vercel domain to Supabase:
- Dashboard → Authentication → URL Configuration → Site URL → set to your Vercel URL
- Add the same URL to "Redirect URLs"

---

## Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## AI Disclosure

This project was built with AI assistance (Kiro). All implementation decisions, architectural choices, and security design were made collaboratively and can be explained in full. The candidate understands every line of code and can discuss trade-offs during review.
