# DEVELOPMENT_PLAN.md

**Last reviewed:** 2026-04-22

## Overall approach

Build the infrastructure first, then the pipeline, then the user-facing
product. Each phase delivers something independently testable. The AI
prompts are already written and proven — the build risk is in the
plumbing around them, not in the intelligence.

---

## Phases

| # | Phase | Delivers | Dependencies | Status | Detailed plan |
|---|---|---|---|---|---|
| 1 | Foundation | Auth, DB schema, portfolio ingestion, admin UI | None | 🔴 pending | `plans/DP-01-foundation.md` |
| 2 | Pipeline Engine | 8-bot Gemini pipeline running server-side, streaming output | Phase 1 | 🔴 pending | `plans/DP-02-pipeline.md` |
| 3 | Chat UI | Real-time chat interface showing bot outputs as they complete | Phase 2 | 🔴 pending | `plans/DP-03-chat-ui.md` |
| 4 | Proposal History | Per-user proposal storage, history view, copy-to-clipboard | Phase 3 | 🔴 pending | `plans/DP-04-history.md` |
| 5 | Hardening | Error handling, cost monitoring, Vercel production config, domain | Phase 4 | 🔴 pending | `plans/DP-05-hardening.md` |

---

## Why this phase order

- Phase 1 before Phase 2: the pipeline needs a portfolio retrieval layer
  and a database to write to — can't build the engine without the
  foundation.
- Phase 2 before Phase 3: the UI streams from the pipeline — need the
  pipeline working and tested before building the stream consumer.
- Phase 3 before Phase 4: history storage requires knowing exactly what
  shape the final proposal output takes — confirmed in Phase 3.
- Phase 4 before Phase 5: can't harden what isn't built; hardening is
  last deliberately.
- Rate limiting deferred past Phase 5: ADR-003 decision — no limits in
  v1, add later if needed.

---

## Current state

**Currently in:** Phase 1 — not started
**Phase started:** —
**Target:** Ship Phase 1-3 as fast as possible; Phase 4-5 follow.

**What's DONE:** Nothing yet — project kick-off session complete,
source docs drafted and approved.

**What's in progress:** Awaiting Dipanshu to create Vercel, GitHub,
and Supabase accounts and share access with Claude Code.

**What's next:** Claude Code implements Phase 1 (Foundation) once
credentials are provisioned.

**Known blockers:** Vercel + GitHub + Supabase + Gemini API key
credentials not yet provisioned.

---

## Phase transitions

Each phase is complete when Claude Code's live-test checklist passes
(§12). Moving to the next phase before that is a §0 violation.
