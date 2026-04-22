# TESTING.md — Testing Philosophy

**Purpose:** The stable rules for how testing is done in this project. Per-feature test cases live in each feature spec, not here. This document covers the universal approach that applies across all features.

**Hard cap:** 2 pages. If it grows beyond this, something is wrong — testing philosophy doesn't need more than two pages.

**Last reviewed:** [YYYY-MM-DD]

---

## 1. What "done" means

A feature is not done until the live-test checklist (§12 of CLAUDE.md) has been run and passed. "Done" means tested in production or staging (or on the target device for local apps), not "tests pass locally on my machine."

## 2. The live-test checklist for every feature

Every non-trivial feature ships with a re-test checklist BEFORE Claude Code moves to the next task:

1. **Numbered checklist** — specific, verifiable steps the owner can run (not vague "check it works")
2. **Happy path first** — the most common user flow
3. **Edge cases** — malformed inputs, rapid clicks, page reloads, network failures, app backgrounding, offline mode
4. **Data verification step** — don't trust the UI; query the underlying store (DB, local storage, file system) to verify the actual write
5. **Regression check** — confirm prior features still work
6. **Negative test** — confirm the fix doesn't accidentally fire in unintended contexts

## 3. Where test cases live

- **Per-feature test cases** → in the feature spec itself (`product/FEATURES/D*.md`), in a "Test Cases" section
- **Prompt evaluation results** → in the prompt file (`prompts/*.md`), in the "Eval" subsection of each version
- **Manual test scripts / fixtures** → in a `tests/` folder in the repo (not in source-of-truth docs)

## 4. How Cowork assists with testing

When Cowork is asked to "test feature X":

1. Read the feature spec to understand expected behaviour
2. Read this document for the universal checklist
3. Generate a specific test plan (numbered, verifiable steps)
4. Either execute the plan (for prompt evaluation, document review, manual UI tests Cowork can run via Claude in Chrome) or hand it to Claude Code (for code-level integration tests)
5. Report results against the checklist — not just "it works" but "step 1 ✅, step 2 ✅, step 3 ❌ because X"

## 5. Testing discipline for LLM outputs (if the product uses LLMs)

- **Eval harness required for every prompt.** Before shipping a prompt change, run the eval harness. Results go in the prompt file (§23 Bloat Discipline — version changelog includes eval numbers).
- **Golden set maintained.** A small set of canonical inputs + expected-behaviour outputs. Updated when expectations change, not when the prompt changes.
- **Regression detection.** Every prompt change runs against the golden set. No change ships if regression is detected without explicit owner sign-off.

## 6. What NOT to do

- Don't run happy path only. Edge cases are where bugs live.
- Don't trust UI inspection alone. Query the data.
- Don't ship a feature with "tests pass locally" — that's not shipped.
- Don't skip regression checks because "this change doesn't touch that area." It probably does.
- Don't batch-test multiple features at once. Test each to completion before moving on (§13 Iterative Development Pattern).

---

## Project-specific adaptations

[Fill in when testing tools / staging environment / eval harness are set up for this specific project.]

**Eval harness location:** [path or URL]
**Staging environment:** [URL or local setup]
**Manual test fixtures:** [path]
**Known-brittle tests:** [list any tests that fail intermittently and what to do when they do]
