# IMPLEMENTATION BRIEF — Phase 4: Proposal History

**Type:** IMPLEMENTATION
**For:** Claude Code
**Prepared by:** Cowork (Shark framework)
**Date:** 2026-04-22
**Reference:** ADR-002, STACK.md, VISION.md

---

## Universal Debug Rule (§3)
Read the actual files before confirming any approach. The hypothesis might
be wrong. Find edge cases and existing workflow conflicts, and address them.

## Plan-Before-Build (§5)
Before writing a single line of code, present:
1. Where you intend to create/modify files and why
2. Your proposed implementation plan (numbered steps)
3. Any questions or confirmations needed before proceeding

---

## What you are building

Phase 4: Proposal History — a per-user view of all past proposals,
with the ability to re-read any past proposal and copy it to clipboard.

The data is already being saved. `proposals` table in Supabase is
populated by the pipeline (Phase 2). Phase 4 is purely a read UI
on top of existing data.

---

## What's already built — read these first

- `app/chat/page.tsx` + `app/chat/ChatForm.tsx` — the chat UI
- `app/api/pipeline/route.ts` — saves to `proposals` table on completion
- `lib/supabase/server.ts` — server-side Supabase client (cookie-based auth)
- `lib/supabase/service.ts` — service role client
- `middleware.ts` — auth protection for all routes except `/login`
- `app/admin/portfolio/actions.ts` — example of server action pattern

The `proposals` table schema (already exists in Supabase):
```
id              uuid  PRIMARY KEY
user_id         uuid  REFERENCES auth.users
job_input       text
proposal_output text
created_at      timestamptz DEFAULT now()
```

RLS policy on `proposals`: users can only SELECT their own rows
(`user_id = auth.uid()`). The pipeline inserts via service role (bypasses RLS).

---

## Deliverables

### 1. Proposals history page — `app/history/page.tsx`

A **server component** that:
- Calls `createClient()` from `lib/supabase/server.ts`
- Queries `proposals` for the current user, ordered by `created_at DESC`
- Renders a list of proposal cards (one per proposal)

Each card shows:
- Date + time of the run (formatted nicely, e.g. "22 Apr 2026, 10:15 PM")
- First 120 characters of `job_input` as a preview (truncated with "...")
- A "View" button/link that expands or navigates to the full proposal

Keep it simple — this is an internal tool, not a public-facing page.
Clean, readable, functional.

### 2. Individual proposal view — `app/history/[id]/page.tsx`

A **server component** that:
- Fetches the single proposal by `id` for the current user
- Returns 404 if not found or belongs to a different user
- Renders:
  - The full `job_input` (the original job post)
  - The full `proposal_output` (the final proposal from Bot 8)
  - A "Copy proposal" button (client component or client interaction)
  - A "← Back to history" link

The "Copy proposal" button copies `proposal_output` to clipboard.
Since this is in a server component page, the copy button should be
a small client component (e.g. `app/history/[id]/CopyButton.tsx`).

### 3. Nav link

Add a "History" link to the nav bar in the root layout
(`app/layout.tsx` or wherever the nav is). It should sit next to
"Chat" and "Portfolio". Auth-protected — only show when logged in
(the middleware already handles redirect, but the link itself should
only render when a session exists).

---

## What Phase 4 does NOT include

- No search or filtering (Phase 5 / future)
- No delete proposal (not needed in v1)
- No pagination (if < 50 proposals, a flat list is fine; add pagination
  in Phase 5 if needed)
- No re-running a proposal from history (future feature)
- No export to PDF/Word (future feature)

---

## Success criteria — Phase 4 is complete when ALL pass

1. After running a pipeline on `/chat`, navigate to `/history` —
   the new proposal appears at the top of the list
2. Click "View" on any proposal — the full job input and proposal
   output are visible
3. Click "Copy proposal" — the proposal text is copied to clipboard
   (verify by pasting into a text editor)
4. Navigate to `/history/some-fake-uuid` — returns 404, not a crash
5. Log in as the same user in a different session — only that user's
   proposals are visible (RLS is enforced)
6. `npx tsc --noEmit` exits 0
7. `npx next lint` exits clean

---

## Architectural rules to follow

**§3 Universal Debug Rule:** Read the actual layout, nav, and chat
files before assuming structure. The nav may already have a pattern
to follow.

**§5 Plan-Before-Build:** Present file plan and questions first.

**§6 Fail-open:** If the proposals query fails, show an empty state
("No proposals yet") rather than crashing the page.

**§10 Ship-clean:** `tsc` + `lint` before commit.

**§11 Secret hygiene:** No new credentials needed — reuse existing
Supabase clients.

**RLS note:** Use `createClient()` (user session client) for all
history queries — this automatically scopes results to the logged-in
user via RLS. Do NOT use the service role client for reads here.
