# DEVELOPMENT_PLAN.md

**Last reviewed:** 2026-04-23

## Overall approach

Build the infrastructure first, then the pipeline, then the user-facing
product. Each phase delivers something independently testable. The AI
prompts are already written and proven — the build risk is in the
plumbing around them, not in the intelligence.

---

## Phases

| # | Phase | Delivers | Dependencies | Status | Detailed plan |
|---|---|---|---|---|---|
| 1 | Foundation | Auth, DB schema, portfolio ingestion, admin UI | None | ✅ DONE | `plans/DP-01-foundation.md` |
| 2 | Pipeline Engine | 8-bot Gemini pipeline running server-side, streaming output | Phase 1 | ✅ DONE | `plans/DP-02-pipeline.md` |
| 3 | Chat UI | Real-time chat interface showing bot outputs as they complete | Phase 2 | ✅ DONE | `plans/DP-03-chat-ui.md` |
| 4 | Proposal History | Per-user proposal storage, history view, copy-to-clipboard | Phase 3 | ✅ DONE | `plans/DP-04-history.md` |
| 5 | Hardening | Error handling, cost monitoring, Vercel production config, domain | Phase 4 | ✅ DONE | `plans/DP-05-hardening.md` |
| 6 | Portfolio Data Quality | Re-ingest 145 real projects from docx with correct parsing, exclude 4 inspiration refs | Phase 5 | ✅ DONE | `plans/BRIEF-Phase6-Portfolio-Reingest.md` |
| 7 | User Management | Admin UI to create/edit/delete users via Supabase Auth admin API | Phase 5 | 🔴 pending | `plans/BRIEF-Phase7-UserManagement.md` |
| 8 | Proposal Quality | Upgrade Bot 6 to output execution blueprint; Bot 7 follows it field-by-field; Bot 8 polish rules | Phase 5 | 🔴 pending | `plans/BRIEF-Phase8-PromptQuality.md` |

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

**Currently in:** Phase 7 — User Management.
**Phase 6 completed:** 2026-04-23 (214 projects ingested, 0 skipped,
4 inspiration refs excluded; backup at
scripts/backups/portfolio-backup-2026-04-23T05-13-31-445Z.json)

**What's DONE:** Phases 1–6 — foundation, pipeline, chat UI, proposal
history, error handling/cost monitoring, portfolio re-ingestion. Live at
https://upwork-automation-six.vercel.app

**What's in progress:** Phase 7 (User Management) — brief ready for
Claude Code.

**What's next:** Phase 8 (Proposal Quality) after Phase 7 ships and
live-test checklist passes. Custom domain setup (Dipanshu manually via
Vercel dashboard).

**Known blockers:** None.

---

## Phase transitions

Each phase is complete when Claude Code's live-test checklist passes
(§12). Moving to the next phase before that is a §0 violation.
