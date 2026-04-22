# ADR-NNN — [Short Title in Active Voice]

**Hard cap:** 1 page. If you need more, it's not an ADR — it's a design doc and belongs in `architecture/`.

**Status:** 🟡 PROPOSED | ✅ ACCEPTED | 🚫 RETIRED
**Date:** [YYYY-MM-DD]
**Deciders:** [Name(s)]
**Supersedes:** [ADR-NNN if any, else "none"]
**Superseded by:** [ADR-NNN if retired, else "—"]

---

## Context

[2-4 sentences. What situation forced this decision? What's changed in the product, the stack, the market, or the constraints that means we can't just continue as before? Be specific — "we need better performance" is not context; "after the Apollo integration shipped, the lead-enrichment path hits 30+ second latency under light load because each lead is processed sequentially" is context.]

## Decision

[1-2 sentences. What we decided, in plain language. Active voice. "We will use BullMQ to queue Apollo enrichment calls." Not "It was decided that..."]

## Alternatives considered

[Name at least 2 alternatives, each in 1-2 sentences. For each, include the specific reason it was rejected — not a vague "seemed worse." This section is what saves you from re-litigating the decision 6 weeks later.]

1. **[Alternative A]** — Rejected because [specific reason].
2. **[Alternative B]** — Rejected because [specific reason].
3. **[Alternative C]** — Rejected because [specific reason]. (optional)

## Consequences

[3-5 bullet points. What changes as a result of this decision? Include the uncomfortable ones — new dependency, new operational burden, new failure mode to watch for. This section is where honesty pays off later.]

- [Positive consequence 1]
- [Positive consequence 2]
- [Negative consequence / tradeoff 1]
- [New thing to monitor / maintain]
- [What this decision explicitly locks us out of doing in future]

## References

[Link to relevant files, specs, conversations, or external docs. Keep it minimal — 2-4 links max.]

---

## Retirement notes (only filled in when status → 🚫 RETIRED)

**Retired on:** [YYYY-MM-DD]
**Retired in favour of:** ADR-NNN
**Reason for retirement:** [1-2 sentences. What changed that made this decision no longer correct? Be honest — "we were wrong" is valid.]

---

## How to use this template

**For a new decision:**
1. Copy this file as `ADR-NNN-short-title.md` where NNN is the next available number
2. Fill in Context, Decision, Alternatives, Consequences
3. Set Status to 🟡 PROPOSED
4. Share with the deciders
5. Once approved, flip Status to ✅ ACCEPTED and date it
6. Add a row to `SOURCE_INDEX.md`

**To retire an ADR:**
1. Write the replacement ADR first (ADR-MMM)
2. In the old ADR, flip Status to 🚫 RETIRED
3. Fill in the "Retirement notes" section at the bottom
4. Add `**Superseded by:** ADR-MMM` at the top
5. In the new ADR, add `**Supersedes:** ADR-NNN`
6. Update `SOURCE_INDEX.md` status for both

Never edit an accepted ADR's Context, Decision, or Alternatives sections. The historical record of what we thought at the time is the whole point.
