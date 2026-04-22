# DP-01: Foundation

**Phase:** 1 of 5
**Status:** 🔴 pending
**Depends on:** Nothing
**Last reviewed:** 2026-04-22

---

## What this phase delivers

At the end of Phase 1, the following are operational and live-tested:

1. GitHub repo initialised with Next.js 14+ (App Router) + TypeScript + Tailwind CSS
2. Vercel project connected to GitHub repo, deploying from main branch
3. Supabase project configured with pgvector extension enabled
4. Database schema created: `users`, `proposals`, `portfolio_items` tables with RLS
5. Supabase Auth wired up: email/password login, protected routes in Next.js
6. Login page live at the Vercel preview URL
7. Portfolio ingestion: HestaBit-Portfolio.docx parsed into structured records, embedded with Gemini text-embedding-004, stored in Supabase portfolio_items table
8. Admin UI: simple page (admin-only) to add new portfolio items via a form — name, URL, description, use cases, tech stack, category — auto-embeds on save
9. All credentials in .env.local (never committed)

---

## Database schema

### portfolio_items
- id (uuid, pk)
- name (text)
- url (text, nullable)
- description (text)
- use_cases (text)
- tech_stack (text)
- category (text) — e.g. "AI/ML", "Web Scraping", "Mobile", etc.
- embedding (vector(768)) — Gemini text-embedding-004 output
- created_at (timestamptz)
- updated_at (timestamptz)

### proposals
- id (uuid, pk)
- user_id (uuid, fk → auth.users)
- job_input (text) — the raw job post + client details the user pasted
- proposal_output (text) — the final Content Formatting Bot output
- created_at (timestamptz)

### No custom users table needed — Supabase auth.users handles it.

---

## RLS policies

- portfolio_items: readable by all authenticated users, writable only by admin (Dipanshu's user ID hardcoded in policy for v1)
- proposals: each user reads/writes only their own rows (user_id = auth.uid())

---

## Success criteria (Phase 1 complete when ALL pass)

1. Login page loads at Vercel preview URL — email/password works
2. Non-logged-in user hitting any protected route is redirected to login
3. Portfolio table has all HestaBit portfolio items loaded with embeddings
4. Admin can add a new portfolio item via the admin UI form — it saves and embeds without developer intervention
5. Proposals table exists with correct schema and RLS (verify via Supabase table editor)
6. `npx tsc --noEmit` exits 0
7. `npx next lint` exits 0 (or matches baseline)

---

## Known risks

- Gemini text-embedding-004 outputs 768-dimension vectors — pgvector must be configured for this dimension
- HestaBit-Portfolio.docx is unstructured — parsing into clean records requires careful extraction logic; Claude Code should flag any items it can't cleanly parse rather than silently dropping them
- Supabase free tier has a 500MB DB limit — well within range for v1
