# D[N]-[feature-name].md

**Hard cap:** 2 pages. If longer, split into sub-specs or scope-cut the feature.

**Spec ID:** D[N]  (monotonically increasing — D1, D2, D3...)
**Feature name:** [short, descriptive]
**Status:** 🔴 pending | 🟡 in progress | ✅ done | ⛔ blocked | 🚫 retired
**Owner:** [Name]
**Last updated:** [YYYY-MM-DD]
**Supersedes:** [previous spec ID if any, else "none"]
**Superseded by:** [new spec ID if retired, else "—"]

---

## 1. What this feature does

[One paragraph. Plain language. A user of this product should be able to understand this without knowing anything about the implementation.]

## 2. Why it belongs in this product

[Reference back to `product/VISION.md`. If the feature doesn't clearly fit the vision, this is where it gets challenged — not during implementation.]

## 3. Inputs

[What does the feature receive? User input, upstream data, events, triggers. Be specific about types, formats, ranges.]

## 4. Outputs

[What does the feature produce? UI changes, data writes, side effects, downstream events.]

## 5. Edge cases

[The cases that will actually break this feature if not handled. Malformed inputs, empty states, rate limits, network failure, concurrent access. Don't be exhaustive — be real.]

## 6. Dependencies

[Other features, services, or specs this depends on. If any dependency is not yet built, this feature is ⛔ blocked.]

## 7. Test cases

[Per §12 Live-Test Discipline. Numbered, specific, verifiable:]

1. Happy path: [step-by-step]
2. Edge case 1: [step-by-step]
3. Edge case 2: [step-by-step]
4. Data verification: [what to check in the DB / store]
5. Regression: [what previously-working features to re-verify]
6. Negative test: [what should NOT happen]

## 8. Open questions

[Before implementation starts, the spec gate (§14) requires these to be resolved. If any remain, spec is 🔴, not 🟡.]

- [ ] Question 1
- [ ] Question 2

---

## Implementation log (populated by Claude Code during build)

| Session | Date | Commits | Status |
|---|---|---|---|
| | | | |

## Post-ship summary (populated when status → ✅ DONE)

[One paragraph. What shipped, what was different from the spec, what was learned. This is what gets kept in `product/FEATURES/_shipped.md` after 30+ days — the full spec moves to `_archive/`.]
