# IMPLEMENTATION BRIEF — Phase 1: Foundation

**Type:** IMPLEMENTATION
**For:** Claude Code
**Prepared by:** Cowork (Shark framework)
**Date:** 2026-04-22
**Reference:** DP-01-foundation.md, STACK.md, ADR-001, ADR-002, ADR-003

---

## Universal Debug Rule (§3)
Read the actual files before confirming any approach. The hypothesis
might be wrong. Find edge cases and existing workflow conflicts, and
address them too.

## Plan-Before-Build (§5)
Before writing a single line of code, present:
1. Where you intend to create files and why
2. Your proposed implementation plan (numbered steps)
3. Any questions or confirmations needed before proceeding

---

## What you are building

Phase 1 of a Next.js 14+ web application called the HestaBit Bid Bot.
It is an internal tool for HestaBit's team to generate Upwork proposals
using an 8-bot Gemini AI pipeline.

Phase 1 scope is infrastructure only — no AI pipeline yet. That is
Phase 2. Your job here is to build the foundation everything else sits on.

---

## Accounts and credentials

The following accounts already exist. You will need the owner to provide
credentials via .env.local.

- **GitHub repo:** https://github.com/dipanshu9099/upwork-automation
- **Vercel project:** https://vercel.com/dipanshu-hestabitcoms-projects
- **Supabase project:** https://supabase.com/dashboard/project/zebbyohygmekkztdfnkq
- **Gemini API key:** to be placed in .env.local as GEMINI_API_KEY

Required environment variables (all go in .env.local, never committed):
```
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Tech stack

- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + pgvector + Auth)
- Gemini text-embedding-004 (for portfolio embeddings)
- Vercel (deployment)

---

## Deliverables — exactly what Phase 1 must ship

### 1. Project initialisation
- Initialise Next.js 14+ project with App Router, TypeScript, Tailwind CSS
- Set up .gitignore (must cover .env.local, .env*.local)
- Connect to GitHub repo: https://github.com/dipanshu9099/upwork-automation
- Connect Vercel project to GitHub repo for auto-deploy on push to main

### 2. Supabase setup
Enable pgvector extension in Supabase. Then create these tables:

**portfolio_items**
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  use_cases TEXT,
  tech_stack TEXT,
  category TEXT,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**proposals**
```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_input TEXT NOT NULL,
  proposal_output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS policies:**
- portfolio_items: SELECT for authenticated users; INSERT/UPDATE/DELETE
  for service role only (admin operations go through server-side API
  route using SUPABASE_SERVICE_ROLE_KEY)
- proposals: SELECT/INSERT for authenticated users where
  user_id = auth.uid()

### 3. Auth — login page + protected routes
- Login page at /login (email + password via Supabase Auth)
- Middleware protecting all routes except /login — redirect unauthenticated
  users to /login
- After login, redirect to /chat (placeholder page for Phase 3)
- Logout button accessible from main layout

### 4. Portfolio ingestion script
Write a one-time Node.js script (scripts/ingest-portfolio.ts) that:
1. Reads HestaBit-Portfolio.docx (owner will provide the file path)
2. Parses it into structured portfolio records — each record has:
   name, url, description, use_cases, tech_stack, category
3. For each record, calls Gemini text-embedding-004 to generate a
   768-dimension embedding of the combined text
   (name + description + use_cases + tech_stack)
4. Upserts each record into Supabase portfolio_items table

**Parsing approach:** The .docx is unstructured prose. Each project
follows a rough pattern: project name → URL (optional) → description →
"Use Case" section → "Tech Stack" / "Technologies:" section. Parse
section by section. If a project cannot be cleanly parsed, log it with
a warning and skip it — do NOT silently drop it and do NOT crash.

**Important:** Gemini text-embedding-004 outputs 768-dimension vectors.
Confirm pgvector is configured for this dimension before ingestion runs.

Run command: `npx ts-node scripts/ingest-portfolio.ts`

### 5. Admin UI — add portfolio items
A simple page at /admin/portfolio (protected, accessible to all
authenticated users in v1 — no separate admin role needed yet).

Form fields: Name, URL (optional), Description, Use Cases, Tech Stack,
Category (dropdown: AI/ML, Web Scraping, Mobile App, Web App,
Creative/Motion, Other).

On submit:
- Server action (or API route) generates embedding via Gemini
  text-embedding-004
- Upserts record into portfolio_items table using service role key
- Shows success/error feedback to user

Existing portfolio items displayed in a simple list below the form
(name + category + url if present). No edit/delete in v1.

---

## What Phase 1 does NOT include

- No AI pipeline (Phase 2)
- No chat UI (Phase 3)
- No proposal history UI (Phase 4)
- No rate limiting (ADR-003 — deferred)
- No separate admin role (v1 trusts all logged-in users)

---

## Success criteria — Phase 1 is complete when ALL pass

1. Login page loads at Vercel preview URL — email/password works
2. Non-logged-in user hitting any protected route redirects to /login
3. Portfolio table has HestaBit portfolio items loaded with embeddings
   (verify: SELECT COUNT(*) FROM portfolio_items returns > 0; spot-check
   3-5 rows have non-null embedding column)
4. Admin can add a new portfolio item via /admin/portfolio form — it
   saves and appears in the list without developer intervention
5. Proposals table exists with correct schema and RLS
6. `npx tsc --noEmit` exits 0
7. `npx next lint` exits clean (establish this as the lint baseline)

---

## Access / confirmation needed before starting

Ask the owner for:
1. Supabase URL + anon key + service role key (from Supabase project
   settings → API)
2. Confirmation that pgvector extension is enabled (or permission to
   enable it via the SQL editor)
3. The HestaBit-Portfolio.docx file path (or confirm it can be read
   from the repo — owner will add it to source-materials/)
4. Gemini API key (<REDACTED — see .env.local> — already shared
   out-of-band; confirm it is active and has embedding model access)

---

## Fail-open rule (§6)
The portfolio ingestion script is a one-time tool, not a user-facing
route. It may throw on failure. All other new routes and server actions
must wrap async operations in try/catch with descriptive error logging.

## Data-layer merge rule (§9)
The admin portfolio form uses UPSERT (not INSERT then UPDATE). Fetch
existing record by name before writing if checking for duplicates.

## Ship-clean rule (§10)
Run `npx tsc --noEmit` and `npx next lint` before every commit.
Zero new type errors. Zero new lint warnings above baseline.
