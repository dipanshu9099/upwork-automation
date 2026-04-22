# ADR-002: Proposal History Storage

**Status:** ✅ Accepted
**Date:** 2026-04-22
**Decided by:** Dipanshu

---

## Decision

Proposals are saved to Supabase per user. Each saved record includes:
the job post input, the final proposal output (Content Formatting Bot),
and a timestamp. Users can view their past proposals, see which job they
were for, and copy them again.

## Alternatives considered

**Option A — Stateless, no history:** Simpler to build in v1. Rejected
because the team generates many proposals and needs to refer back to
them. Rebuilding from scratch each time is wasteful.

## Consequences

- Supabase needs a `proposals` table with user_id, job_input (text),
  proposal_output (text), created_at (timestamp).
- Row Level Security ensures each user sees only their own proposals.
- Phase 4 (Proposal History) implements the history view UI.
- Storage cost is negligible — proposals are text-only.
- Intermediate bot outputs (Persona, Technical, etc.) are NOT stored —
  only the final proposal. Storing all 8 outputs would bloat the DB
  with data nobody re-reads.
