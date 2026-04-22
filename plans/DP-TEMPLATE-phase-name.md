# DP-NN — [Phase Name]

**Hard cap:** 3 pages. If larger, split into sub-phases (DP-NN-a, DP-NN-b) or move detail into feature specs.

**Phase ID:** DP-[NN]  (monotonically increasing — DP-01, DP-02, DP-03...)
**Phase name:** [short, descriptive — e.g. "Base Setup", "Core Loop", "Relationship Building"]
**Status:** 🔴 pending | 🟡 in progress | ✅ done | ⛔ blocked | 🚫 retired
**Owner:** [Name]
**Prerequisite phases:** [DP-NN that must be ✅ before this starts, or "none"]
**Last updated:** [YYYY-MM-DD]

---

## 1. Phase goal

[One paragraph. What does "done" mean for this specific phase? What's operational at the end? Plain language — the founder should be able to understand it, not just the developer.]

## 2. Why this phase exists (where it sits in the journey)

[2-3 sentences. Why this phase before the next one, why this phase after the previous one. Reference `DEVELOPMENT_PLAN.md` if the thesis lives there.]

## 3. Workstreams within this phase

[Phases are not single tracks. They usually contain 2-5 workstreams happening within the phase. List them. Each workstream can then map to specific feature specs.]

| # | Workstream | What it delivers | Depends on | Status |
|---|---|---|---|---|
| 1 | [e.g. auth + user accounts] | [concrete deliverable] | [none] | 🟡 |
| 2 | [e.g. data model + migrations] | [concrete deliverable] | [none] | 🔴 |
| 3 | [e.g. first UI skeleton] | [concrete deliverable] | workstream 1 | 🔴 |

## 4. Features mapped to this phase

[Cross-reference to feature specs. Each D*.md spec should note which phase it belongs to; this table aggregates.]

| Feature spec | Workstream | Status |
|---|---|---|
| `product/FEATURES/D1-*.md` | 1 (auth) | 🟡 |
| `product/FEATURES/D2-*.md` | 2 (data model) | 🔴 |

## 5. Decisions expected in this phase

[ADRs that this phase will force. Sometimes known upfront; sometimes discovered during. Listing them here helps catch them when they emerge.]

- **Likely ADR:** [e.g. "auth provider — Supabase Auth vs Auth0"]
- **Likely ADR:** [e.g. "data model — normalised vs denormalised for X"]
- [Add ADR numbers as they're written, with status]

## 6. Success criteria

[What must be verifiably true before this phase is ✅ DONE. Numbered, specific, testable — not "feels ready." Tied to §12 Live-Test Discipline.]

1. [e.g. A new user can sign up, verify email, and log in — tested end-to-end]
2. [e.g. Data migrations run cleanly on a fresh DB — verified via migration log]
3. [e.g. All features in the features table are ✅ DONE]
4. [e.g. Lint + typecheck clean — §10 Ship-Clean satisfied across all files in this phase]

**Phase is not DONE until every criterion passes.** No partial credit.

## 7. Known risks + mitigations

[2-5 items. Be honest. Solo founder should list risks the framework alone can't catch.]

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| [e.g. Auth provider complexity eats 2 weeks] | Medium | High | Write spike ADR in week 1 before committing |
| [e.g. Data model requires major rework after Phase 2] | Low | High | Pressure-test model against Phase 2 workstream before locking |

## 8. Estimated timeline

[Honest, not optimistic. Solo developer; assume interruptions.]

- Workstream 1: [N weeks]
- Workstream 2: [N weeks]
- Workstream 3: [N weeks]
- Integration + testing: [N weeks]
- **Phase total:** [N weeks]

**Started:** [YYYY-MM-DD when status flipped to 🟡]
**Target done:** [YYYY-MM-DD, honest]
**Actual done:** [populate when ✅]

---

## 9. Implementation log (populated as phase runs)

| Session / date | Workstream | What shipped | Commit | Status change |
|---|---|---|---|---|
| | | | | |

## 10. Phase retrospective (populated when phase → ✅ DONE)

[1 paragraph. What went well, what went slow, what was learned. Honest. This is what feeds the next phase's planning.]

**What went well:** [1-2 sentences]
**What went slower than expected:** [1-2 sentences — and why]
**What I'd do differently:** [1-2 sentences]
**Key learnings for next phase:** [1-2 sentences]

---

## Calibration notes

When Cowork proposes an update to a DP-NN-*.md:
- Workstream changes during a phase need justification in the log
- Moving a feature to a different phase requires updating both DPs + the feature spec
- Success criteria should not be edited mid-phase (that's moving the goalposts)
- Timeline slippage should be recorded honestly in Section 8 — don't just update the target without noting the original
