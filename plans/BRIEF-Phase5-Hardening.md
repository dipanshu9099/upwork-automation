# IMPLEMENTATION BRIEF — Phase 5: Hardening

**Type:** IMPLEMENTATION
**For:** Claude Code
**Prepared by:** Cowork (Shark framework)
**Date:** 2026-04-22
**Reference:** ADR-003, STACK.md, CLAUDE.md §23

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

Phase 5 is the final hardening pass before the app is considered
production-ready. No new features. The goals are:

1. **Error UX** — user-facing errors are clear and recoverable, not blank
   screens or raw stack traces
2. **Cost visibility** — basic Gemini API usage logging so Dipanshu can
   see how much each pipeline run costs
3. **Environment hygiene** — confirm all env vars are set in Vercel
   production, no missing keys that would cause silent failures
4. **Global error boundary** — Next.js `error.tsx` files so unhandled
   errors show a friendly page, not a Next.js crash screen

---

## What's already built — read these first

- `app/layout.tsx` — root layout and nav
- `app/chat/ChatForm.tsx` — pipeline SSE client, already has per-bot
  error card display
- `app/api/pipeline/route.ts` — pipeline orchestrator, already has
  per-bot try/catch and `pipeline-error` SSE event
- `lib/pipeline/run.ts` — bot loop with fail-open per §6
- `lib/gemini/generate.ts` — Gemini text wrapper
- `lib/gemini/retrieve.ts` — portfolio retrieval
- `app/history/page.tsx` — already has fail-open empty state
- `app/history/[id]/page.tsx` — already uses `notFound()`

---

## Deliverables

### 1. Global error boundary — `app/error.tsx`

Next.js App Router root error boundary. Catches unhandled errors in any
route that doesn't have its own `error.tsx`.

Requirements:
- Must be a `'use client'` component (Next.js requirement)
- Show a friendly message: "Something went wrong. Please try again."
- Include a "Try again" button that calls `reset()` (passed by Next.js)
- Include a "Go to Chat" link back to `/chat`
- Match the existing app's minimal styling (Tailwind, same font/colours
  as other pages)

Also add `app/history/error.tsx` with the same pattern — scoped to the
history route so a DB error there doesn't bubble to the root boundary.

### 2. Not-found page — `app/not-found.tsx`

Custom 404 page for the whole app (currently showing the raw Next.js
default 404).

Requirements:
- "Page not found" heading
- Brief message: "The page you're looking for doesn't exist."
- Link back to `/chat`
- Same minimal styling as the rest of the app

### 3. Cost logging in the pipeline — `lib/pipeline/run.ts`

After each bot call completes, log the token usage to the server console.
The Gemini SDK returns `usageMetadata` on the response object.

Log format (one line per bot, server-side only — never sent to client):
```
[pipeline] persona | promptTokens: 412 | candidatesTokens: 891 | totalTokens: 1303
```

After all 8 bots complete, log a summary:
```
[pipeline] TOTAL | promptTokens: 8234 | candidatesTokens: 12443 | totalTokens: 20677 | estimatedCost: $0.031
```

Gemini 2.5 Pro pricing (as of April 2026):
- Input: $1.25 per 1M tokens (prompts ≤ 200k)
- Output: $10.00 per 1M tokens

Formula:
```
cost = (totalPromptTokens / 1_000_000 * 1.25) + (totalCandidatesTokens / 1_000_000 * 10.00)
```

**Important:** `usageMetadata` may be undefined if the SDK version doesn't
expose it or if the call failed. Wrap the cost logging in a try/catch —
if usage data isn't available, log `[pipeline] cost data unavailable` and
continue. Do NOT let cost logging break the pipeline.

### 4. Environment variable validation — `lib/env.ts`

A startup check that validates all required env vars are present.
Call it from `app/api/pipeline/route.ts` at the top of the handler
(before any work starts).

Required vars to check:
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If any are missing: return a `500` JSON response with
`{ error: "Server misconfiguration. Contact admin." }` — do NOT expose
which variable is missing in the response (log it server-side only).

Pattern:
```typescript
// lib/env.ts
export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`[env] Missing required environment variable: ${key}`);
    throw new Error(`Missing env: ${key}`);
  }
  return val;
}
```

Call `requireEnv` for each of the 4 vars inside the route handler,
wrapped in try/catch that returns 500 on failure.

### 5. Loading state for history page — `app/history/loading.tsx`

Next.js App Router `loading.tsx` for the history route. Currently the
history page has no loading UI — on a slow connection it shows a blank
white screen while the server component fetches proposals.

Simple skeleton:
- Same page width/padding as `app/history/page.tsx`
- "Proposal history" heading (static, not a skeleton)
- 3 grey skeleton card shapes (rounded, animated pulse) where the
  proposal cards will appear

---

## What Phase 5 does NOT include

- No rate limiting (ADR-003 — deferred indefinitely)
- No custom domain setup (Dipanshu handles this manually via Vercel
  dashboard — not a code task)
- No cost alerting / budget caps (future feature)
- No Sentry or external error tracking (overkill for v1)
- No automated tests (future phase)

---

## Success criteria — Phase 5 is complete when ALL pass

1. Navigate to a URL that doesn't exist (e.g. `/xyz`) → custom 404 page
   appears, not the Next.js default
2. Trigger an error in the history route (temporarily break the Supabase
   query) → `app/history/error.tsx` shows, not a blank screen
3. Run the pipeline → Vercel runtime logs show per-bot token counts and
   the TOTAL cost line
4. Remove `GEMINI_API_KEY` from `.env.local` temporarily, hit `/api/pipeline`
   → returns HTTP 500 with `{ error: "Server misconfiguration..." }`, does
   NOT crash with an unhandled exception or expose the var name
5. Navigate to `/history` on a slow connection (throttle in DevTools) →
   skeleton loading state appears before the list loads
6. `npx tsc --noEmit` exits 0
7. `npx next lint` exits clean

---

## Architectural rules

**§3 Universal Debug Rule:** Read `lib/pipeline/run.ts` and
`app/api/pipeline/route.ts` before touching either. The cost logging
slots into the existing bot loop — read the actual loop structure first.

**§5 Plan-Before-Build:** Present file plan and questions first.

**§6 Fail-open:** Cost logging must never break the pipeline. Env
validation is the only place a hard failure is correct (before any
user work has started).

**§10 Ship-clean:** `tsc` + `lint` before commit.
