# STACK.md

**Hard cap:** 500 words.
**Last reviewed:** 2026-04-22
**Owner:** Dipanshu (dipanshuupadhyay@gmail.com)

---

## Frontend

**Next.js 14+ (App Router) + TypeScript**
Chosen for: SSR, clean routing, Vercel-native deployment, type safety.
Vercel is the initial host — Next.js is the natural fit.

**Tailwind CSS**
Chosen for: rapid UI development, no CSS file sprawl, consistent design
tokens without a heavy component library.

---

## Backend / API

**Next.js API Routes (serverless functions on Vercel)**
Chosen for: no separate backend server to manage in v1. API routes handle
pipeline orchestration, auth checks, and Supabase reads/writes.
Migration path: if pipeline latency becomes an issue, extract to a
standalone Node.js server later — no rewrite needed.

---

## AI Pipeline

**Gemini 2.5 Pro (Google AI API)**
Chosen for: competitive reasoning quality vs GPT-5/5.4 at meaningfully
lower cost per token. 8 sequential high-reasoning calls per proposal make
per-call cost the primary driver.

All 8 bot prompts are preserved exactly from the OpenAI version.
State is passed explicitly between bots as text (same pattern as the
current {{state.output_persona}} variables).

---

## Portfolio Retrieval

**Supabase + pgvector**
Chosen over OpenAI vector store because: OpenAI vector store is tied to
the OpenAI platform. Moving to Gemini means rebuilding retrieval anyway.
pgvector in Supabase gives semantic search + structured filtering + a
simple admin UI path for adding new portfolio items — all in one place.

**Gemini Embedding Model (text-embedding-004)**
Used to embed portfolio items at write time and embed the retrieval query
at search time. Keeps the entire stack on one AI provider.

Portfolio items are stored as structured records (name, URL, description,
use cases, tech stack, category) with a vector column. New items added
via a simple admin form — no developer required.

---

## Database & Auth

**Supabase (PostgreSQL)**
Chosen for: managed Postgres, built-in auth (email/password for v1),
Row Level Security for user isolation, pgvector extension, and a simple
admin UI for portfolio management.

User management: admin creates accounts, users log in with email +
password. No self-signup in v1.

---

## Hosting & Deployment

**Vercel (initial)**
Chosen for: zero-config Next.js deployment, preview URLs per branch,
easy environment variable management.

**Git (GitHub)**
All code pushed to GitHub. Vercel deploys from main branch automatically.

**Future:** point custom domain (hestalabs.com subdomain) when ready.
Vercel makes this a one-step DNS change.

---

## Key decisions still open (ADR candidates)

1. Streaming vs batch for pipeline output — does the UI show bot outputs
   one by one as they complete, or show the final proposal only?
2. Conversation history storage — do we store past proposals per user
   in Supabase, or keep it stateless (no history) in v1?
3. Rate limiting strategy — how do we prevent one user from hammering
   the Gemini API and burning the budget?
