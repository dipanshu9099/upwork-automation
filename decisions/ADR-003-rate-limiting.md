# ADR-003: Rate Limiting Strategy

**Status:** ✅ Accepted
**Date:** 2026-04-22
**Decided by:** Dipanshu

---

## Decision

No rate limiting in v1. The team is trusted to use the system
responsibly. Dipanshu monitors Gemini API costs manually via the Google
AI console. Limits will be added in a future version if costs become
unpredictable.

## Alternatives considered

**Option B — Per-user daily limit:** More controlled but adds admin
overhead and complexity. Rejected for v1 — team is small and known.

**Option C — Global daily budget cap:** Safer for cost control but
could block legitimate users mid-day. Rejected for v1.

## Consequences

- No rate-limit middleware needed in v1.
- Dipanshu must check Gemini API usage dashboard periodically.
- If a user accidentally triggers many proposals (e.g. a bug or loop),
  costs could spike without warning.
- Revisit this decision when the team grows beyond 5 active users or
  monthly AI costs exceed a defined threshold.
