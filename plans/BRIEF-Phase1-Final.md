# IMPLEMENTATION BRIEF — Phase 1: Foundation (FINAL — with credentials)

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

## Credentials — write these to .env.local immediately

```
GEMINI_API_KEY=<REDACTED — see .env.local>
NEXT_PUBLIC_SUPABASE_URL=<REDACTED — see .env.local>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<REDACTED — see .env.local>
SUPABASE_SERVICE_ROLE_KEY=<REDACTED — see .env.local>
```

These are legacy anon + service_role JWT keys from Supabase (the format
the Supabase JS client expects). Write them to `.env.local` in the
project root. Never commit .env.local — confirm .gitignore covers it.

---

## Accounts

- **GitHub repo:** https://github.com/dipanshu9099/upwork-automation
- **Vercel project:** https://vercel.com/dipanshu-hestabitcoms-projects
- **Supabase project:** https://supabase.com/dashboard/project/zebbyohygmekkztdfnkq

---

## Tech stack

- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS
- Supabase JS client v2 (@supabase/supabase-js, @supabase/ssr)
- Gemini text-embedding-004 (via @google/generative-ai) for portfolio embeddings
- Vercel (deployment)

---

## Deliverables — exactly what Phase 1 must ship

### 1. Project initialisation
- Initialise Next.js 14+ project with App Router, TypeScript, Tailwind CSS
- Set up .gitignore (must cover .env.local, .env*.local)
- Install dependencies: @supabase/supabase-js @supabase/ssr @google/generative-ai
- Push to GitHub repo: https://github.com/dipanshu9099/upwork-automation
- Connect Vercel project to GitHub repo for auto-deploy on push to main

### 2. Supabase setup
Run this SQL in the Supabase SQL editor for the project zebbyohygmekkztdfnkq:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Portfolio items table
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

-- Proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_input TEXT NOT NULL,
  proposal_output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: portfolio_items
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read portfolio"
  ON portfolio_items FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE on portfolio_items goes through server API route
-- using SUPABASE_SERVICE_ROLE_KEY which bypasses RLS — no additional policy needed

-- RLS: proposals
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Vector similarity search index (IVFFlat — good for our portfolio size)
CREATE INDEX ON portfolio_items USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
```

After running the SQL, create the first user in Supabase Auth:
- Email: dipanshuupadhyay@gmail.com
- Set a temporary password (owner will change it on first login)
- Do NOT enable self-signup (Email signups should remain invite-only)

### 3. Auth — login page + protected routes
- Login page at /login (email + password via Supabase Auth using @supabase/ssr)
- Next.js middleware (middleware.ts) protecting all routes except /login and
  /api/auth — redirect unauthenticated users to /login
- After login, redirect to /chat (placeholder page for Phase 3)
- Logout button accessible from main layout
- Use the @supabase/ssr pattern with cookie-based session management
  (createServerClient for Server Components/Route Handlers,
  createBrowserClient for Client Components)

### 4. Portfolio ingestion script
Write a one-time Node.js script at scripts/ingest-portfolio.ts that:
1. Accepts the .docx file path as a CLI argument: 
   `npx ts-node scripts/ingest-portfolio.ts ./path/to/HestaBit-Portfolio.docx`
2. Parses the .docx into structured portfolio records using mammoth or docx
   — each record: name, url, description, use_cases, tech_stack, category
3. For each record, calls Gemini text-embedding-004 to generate a
   768-dimension embedding of the combined text
   (name + " " + description + " " + use_cases + " " + tech_stack)
   — use task_type: "RETRIEVAL_DOCUMENT" when generating document embeddings
4. Upserts each record into Supabase portfolio_items using the service role key

**Parsing approach:** The .docx is unstructured prose. Projects follow a rough
pattern: project name (often bold or heading) → URL (optional) → description →
use cases section → tech stack / technologies section. Parse section by section.
If a project cannot be cleanly parsed, log a warning and skip it — do NOT crash.

### 5. Admin UI — add portfolio items
Page at /admin/portfolio (auth-protected, any logged-in user in v1).

Form fields:
- Name (text, required)
- URL (text, optional)  
- Description (textarea)
- Use Cases (textarea)
- Tech Stack (textarea)
- Category (dropdown: AI/ML | Web Scraping | Mobile App | Web App | Creative/Motion | Other)

On submit (server action or API route):
- Generate embedding via Gemini text-embedding-004 (task_type: "RETRIEVAL_DOCUMENT")
- Upsert record into portfolio_items using SUPABASE_SERVICE_ROLE_KEY
- Return success/error feedback to user

Below the form: simple table listing existing portfolio items
(name, category, url if present). No edit/delete in v1.

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
   (verify: SELECT COUNT(*) FROM portfolio_items returns > 0;
   spot-check 3-5 rows have non-null embedding column)
4. Admin can add a new portfolio item via /admin/portfolio form — it
   saves and appears in the list without developer intervention
5. Proposals table exists with correct schema and RLS policies in place
6. `npx tsc --noEmit` exits 0
7. `npx next lint` exits clean (establish this as the lint baseline)

---

## Architectural rules to follow

**Fail-open (§6):** All route handlers and server actions must wrap async
operations in try/catch with descriptive error logging. The ingestion
script may throw on failure — it is a dev tool, not user-facing.

**Data-layer merge (§9):** The admin form uses UPSERT, not blind INSERT.
Check for duplicate name before writing.

**Ship-clean (§10):** Run `npx tsc --noEmit` and `npx next lint` before
every commit. Zero new type errors. Zero new lint warnings.

**Secret hygiene (§11):** .env.local must be gitignored. Grep tracked
files for credential patterns before every push — must return empty.
SUPABASE_SERVICE_ROLE_KEY must never appear in client-side code.

**Background work (§7):** This phase has no background jobs. The embedding
generation in the admin form is synchronous (await it before responding).
