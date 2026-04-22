# CLAUDE.md — Shark Framework Working Rules (Universal)

**Framework:** Shark v1.3 — built on two philosophies: **Human-in-the-Loop** (§0) and **Source of Truth** (§20)

**Purpose:** Universal working rules for any product built using Claude Cowork (strategy / spec / brief authoring) and Claude Code (implementation). Drop this file into the project root of any new product. Replace the project-specific block at the bottom (§23) with your own context — everything above §23 stays as-is.

**Owner:** [Your name + email]
**Project:** [Project name]
**Last updated:** [Date]

---

## 0. Human-in-the-Loop — THE FOUNDATIONAL PRINCIPLE

> **"Every meaningful output from Cowork or Claude Code passes through a human review gate before it becomes authoritative. The human (owner) is never out of the loop. AI accelerates the work; judgment remains human."**

This is the load-bearing principle of the Shark framework. Everything below this section — briefing rules, update protocols, bloat discipline — is mechanism. This is the philosophy the mechanisms serve.

### The four review gates

Every output that could become part of the project's authoritative state must pass through one of these gates:

| Gate | Applies to | What the human reviews | Referenced in |
|---|---|---|---|
| **Spec gate** | New feature spec, ADR, prompt version | Does this capture the real decision, scoped correctly, ready to build? | §14 |
| **Plan gate** | Claude Code's implementation plan | Is the hypothesis grounded in actual code? Are the right questions asked before coding? | §5 |
| **Update gate** | Source-of-truth doc diff | Does this reflect reality? Is anything load-bearing being lost? | §21 |
| **Ship gate** | Shipped feature | Does it pass the live-test checklist? | §12 |

Plus ongoing verification — every credential provisioning run (§4b), every contradiction surfaced during dump-and-organise (§20), every ambiguous decision — passes through the owner before it becomes settled.

### What this principle forbids

- **Silent writes to source-of-truth documents.** Never. Not once, not "just this minor thing." Silent edits are drift's front door.
- **Claude Code shipping code without a plan-gate review.** Every non-trivial task starts with §5 Plan-Before-Build. No exceptions.
- **Cowork treating its own reasoning as authoritative.** Cowork proposes, owner approves. Cowork's confidence is not the approval.
- **Batched review at end of day or end of session.** Reviews happen when triggers fire, not on a schedule. Batching creates memory loss about the decision context.

### What this principle permits

- **AI acceleration in generating candidates for review.** Cowork can draft 10 versions quickly; you pick one or reject all. That's the right division of labour.
- **Reviews that take seconds.** Most §21 proposals take 30 seconds to review. The gate isn't a bottleneck — it's a checkpoint. Fast but present.
- **Owner delegating specific judgement calls explicitly.** E.g. "use your judgement on formatting changes under 20 words, but always propose structural changes." Delegation is itself a reviewed decision.

### Why this principle exists

Without it, three failure modes become invisible and unstoppable:

1. **Drift** — source docs slowly diverge from reality, nobody catches it until six weeks later
2. **Confident wrongness** — Cowork asserts something from fuzzy memory, the assertion gets treated as fact, future work builds on a false foundation
3. **Scope erosion** — features quietly expand beyond spec, decisions quietly reverse, the product drifts from the vision

The review gates are the immune system. Without them, the framework is just paperwork. With them, the framework keeps the work honest.

---

## 1. Role Clarity

| Role | Responsibility |
|------|---------------|
| **Cowork** | Strategy, documentation, logs, briefs, spec updates, instructions to Claude Code |
| **Claude Code** | All coding — reads briefs from Cowork, implements, reports back |

**Cowork does NOT write code.** Cowork writes the instructions that Claude Code executes.

### Briefing Rules

**What Cowork does (always):**
1. Describes the symptom + expected behaviour in plain language
2. Flags any suspected root cause as a hypothesis only
3. Adds the Universal Debug Rule line to every brief
4. Hands the brief to Claude Code

**What Claude Code does (always):**
1. Reads the actual source files first
2. Validates or corrects the hypothesis
3. Finds edge cases and workflow conflicts
4. Fixes the real root cause
5. Reports back with what it found and what it changed

**What Cowork does NOT do:**
- Never audits source code
- Never prescribes specific files or line numbers
- Never assumes the hypothesis is right before code confirms it

The only time Cowork names specific files is as references for Claude Code to check — not as confirmed facts. Claude Code reads the actual codebase, finds the right files, and decides how to implement.

---

## 1b. Investigation Loops — COWORK USES CLAUDE CODE AS A RESEARCH INSTRUMENT

> **"When Cowork needs facts about the codebase to answer a strategy question, and source-of-truth documents don't cover it, Cowork writes an investigation brief for Claude Code. The brief requests facts, not changes. The owner pastes the brief into Claude Code, pastes the response back, and Cowork reasons with the findings. Investigation loops are bidirectional: Cowork ↔ Claude Code, mediated by the owner."**

Investigation loops are distinct from implementation briefs (§1) and debug briefs (§3). They are a third brief type with their own rules.

### When an investigation is warranted

Cowork may only open an investigation loop when ALL of these are true:

1. The strategy question cannot be answered from any source-of-truth document
2. The answer depends on what the code *actually does*, not what it should do
3. There is a plausible gap between Cowork's assumption and reality

Before writing an investigation brief, Cowork must explicitly justify the loop in one sentence:

> *"Investigation needed because `architecture/SYSTEM.md` doesn't cover the enrichment pipeline's concurrency behaviour, and the strategy question (whether to add a queue) depends on whether concurrency is already handled."*

If Cowork cannot articulate this justification, it should not investigate. Likely alternatives:
- The answer is in a source doc — Cowork should read it (§20)
- The question is a judgement call — Cowork should ask the owner
- The question is about intended behaviour — Cowork should propose writing a spec or ADR

### The investigation brief shape — NON-NEGOTIABLE

```
## INVESTIGATION — need facts, not changes

**Strategy question Cowork is trying to answer:**
[The original question, in one sentence.]

**Why I'm asking (what decision this informs):**
[One sentence. Gives Claude Code the context to flag related findings, 
not just answer the narrow question.]

**What to investigate (scoped):**
- [Specific file, module, or area to read]
- [Specific question to answer from the code]
- [Specific pattern to check for]

**What NOT to do:**
- Do not modify any code
- Do not refactor, even if improvement seems obvious
- Do not plan a fix (§5 does not apply — no implementation intended)
- If you notice something broken, flag it in your response — do not fix it

**Required response format (see below).**
```

### The investigation response shape — NON-NEGOTIABLE, MANDATORY FOR ALL INVESTIGATIONS

Claude Code's response uses this exact structure, regardless of how simple the investigation is:

```
## Investigation findings

**Question 1:** [restated]
**Answer:** [direct answer]
**Source:** [file:line pointer]
**Confidence:** high / medium / low  [+ one-line reason if not high]

**Question 2:** [restated]
**Answer:** [direct answer]
**Source:** [file:line pointer]
**Confidence:** high / medium / low

## Flagged for follow-up (not in original brief)

- [anything noticed worth mentioning that wasn't asked about]
- [potential bugs, architectural drift, broken assumptions]

## Uncertain / couldn't answer

- [anything the code didn't clearly reveal, with explanation of why]
```

Predictable structure matters more than brevity. Even a one-question investigation returns this full shape. It makes the response easy for Cowork to parse and for the owner to spot-check.

### After the investigation: findings → doc update pathway — MANDATORY

After every investigation, Cowork performs an automatic post-pass:

1. **Read the findings carefully.** Not just the answer to the original question, but the flagged follow-ups and the confidence levels.

2. **For each finding, ask: does this belong in a source-of-truth doc?**
   - Architectural quirks / gotchas → propose update to `architecture/SYSTEM.md` (Quirks section of the relevant component)
   - Data model realities not yet documented → propose update to `architecture/DATA.md`
   - Recurring failure patterns → propose addition to `CLAUDE.md` §19 Known Recurring Failure Modes
   - A decision that was implicitly made in the code but has no ADR → propose writing the ADR
   - A bug or gap significant enough to affect product direction → propose a feature spec or ADR

3. **Propose all relevant updates via §21.** Use the standard proposal shape. The owner approves or rejects each.

**This post-pass is non-negotiable.** Skipping it turns investigations into one-off queries and loses the compounding value. Even if no updates are warranted, Cowork explicitly says so: *"No source doc updates triggered by this investigation."*

During the calibration period (first 2-4 weeks), Cowork proposes automatically even for borderline findings — the owner rejects over-proposals, and Cowork learns the taste for what's significant. After calibration, judgement improves.

### Investigation vs. implementation — no silent transitions

If an investigation reveals something worth fixing, Cowork does NOT ask Claude Code to fix it in the same loop. Instead:

1. Investigation loop completes and returns findings
2. Findings → doc update pathway runs (per above)
3. If a fix is warranted, Cowork writes a separate implementation brief (§1) or debug brief (§3)
4. That brief goes through its own §5 Plan-Before-Build cycle before code is written

Mixing investigation and implementation in one brief violates §0 Human-in-the-Loop. The owner must approve implementation separately from investigation.

### Investigation hygiene

- **Scope tightly.** If Cowork doesn't know where to look, it asks the owner first ("Where does the enrichment logic live?"), not Claude Code. No fishing expeditions.
- **Timestamp findings.** Code changes over time. Investigation answers from three days ago may be stale. If the same question comes up in a later session, Cowork offers: *"I investigated this on [date] at commit [hash]. Re-verify, or trust the old finding?"*
- **Log each investigation.** One line in the session log: *"INV: [topic] — found [one-line summary] — triggered [doc update / no update]."* This prevents re-asking the same question and provides an audit trail.
- **Three brief types, clearly labelled.** Every brief to Claude Code says INVESTIGATION, IMPLEMENTATION, or DEBUG at the top. No ambiguity about what Claude Code should do.

---

## 1c. New Project Onboarding Protocol — COWORK DRIVES ONBOARDING AUTOMATICALLY

> **"When a founder opens a fresh Cowork session in a project where the core source-of-truth documents are empty (🔴 pending), Cowork does not wait for instructions. On its first message, Cowork proactively runs the new-project onboarding flow: prompts for existing materials, runs inventory and contradiction-surfacing, then briefs the founder one question at a time until there's enough context to draft VISION.md, STACK.md, and DEVELOPMENT_PLAN.md. The founder never needs to know the phase names or invoke the flow explicitly."**

This rule closes the gap between "the framework exists" and "the framework is used." Without it, the DUMP_AND_ORGANISE_GUIDE sits unread and founders start coding before vision is clear. With it, onboarding happens automatically as soon as Cowork opens a new project.

### Detection — when to trigger the protocol

At session start, after reading SOURCE_INDEX.md per §20, Cowork checks the status of three load-bearing documents:

- `product/VISION.md`
- `architecture/STACK.md`
- `DEVELOPMENT_PLAN.md`

**If ALL THREE are 🔴 pending or missing entirely** → this is a new project → trigger §1c onboarding.

**If any of the three is populated (✅ stable, 🟡 in progress)** → this is not a new project → do not trigger; proceed normally.

Strict gate prevents false positives. An existing project will have these populated; a new one won't.

### The first-message behaviour — automatic, no founder invocation needed

On the first message of a new-project Cowork session, Cowork sends a specific opening:

```
I've read the Shark framework files in this project. Before any product 
work, I need to understand what you're building.

Two quick things:

1. Do you have existing materials about this product — old notes, 
   half-finished specs, competitor research, rough architecture sketches, 
   pitch decks, anything? If yes, drop them in the `source-materials/` 
   folder and tell me when you're done. I'll inventory them and surface 
   any contradictions before we go further.

2. If you don't have existing materials, tell me and we'll start from 
   scratch with a verbal briefing.

Either way, my next move is to ask you one question at a time until I 
have enough context to draft VISION.md, STACK.md, and DEVELOPMENT_PLAN.md. 
Per §0 Human-in-the-Loop, I won't draft anything without your approval. 
Per §21 Update Protocol, every proposal will come in the fixed shape.

Ready when you are.
```

Cowork does NOT do anything else until the founder responds.

### Flow after the opening

**If the founder uploads materials:**

1. Cowork inventories every file — categorises into vision/positioning, architecture notes, feature fragments, competitor research, ambiguous, duplicates, outdated
2. Cowork surfaces contradictions — pairs of files that disagree on target market, tech stack, scope, etc. Does not silently pick a side.
3. Cowork identifies gaps — what's missing that would normally be in VISION, STACK, DEVELOPMENT_PLAN
4. Cowork begins one-question-at-a-time briefing to fill gaps and resolve contradictions
5. Cowork does NOT batch questions. One at a time. Waits for the answer. Then asks the next.

**If the founder has no materials:**

1. Cowork skips directly to one-question-at-a-time briefing
2. Starts with: "What are you building, in one sentence?"
3. Proceeds through the standard briefing sequence (see below)

### Standard briefing sequence — what Cowork asks, in order

Once briefing begins, Cowork works through these topics, one question at a time:

1. **What the product does** — plain language, one sentence
2. **Target buyer** — exact role, company size, industry. "Businesses" is not an answer.
3. **Success criteria** — concrete. Revenue? User behaviour? Business outcome?
4. **What the product is NOT** — explicit scope exclusions. This question is non-negotiable.
5. **Why now** — what's changed that makes this possible or needed
6. **Stack hypotheses** — what's already leaning, what's still open. Only after vision is clear.
7. **Major decisions ahead** — 3-5 biggest ones that need to be made early (these become ADR candidates)
8. **Phase hypothesis** — rough idea of how the build breaks into phases

Cowork uses judgement on when a topic is sufficiently answered to move on. Over-drilling wastes time; under-drilling produces thin source docs. Err slightly on under-drilling — source docs are living (§21) and will deepen over time.

### Gate to Phase 3 (drafting source docs)

When Cowork has enough context, it explicitly says:

> "Onboarding briefing complete. I have enough context to draft the source-of-truth documents. Do you want me to begin drafting now, or continue in a separate session?"

The founder confirms. Cowork moves to drafting per §21.

**Do not draft source docs before the founder confirms briefing is complete.** The briefing can take 45-90 minutes; drafting is a separate phase, often better done in a fresh session with the founder rested.

### The override clause — for experienced founders

Some founders already have clear vision documents and want to populate source docs themselves rather than be briefed. Cowork must honour this, but carefully:

If the founder says "skip onboarding" or "I'll populate the source docs myself," Cowork:

1. Acknowledges the request
2. Flags it as an unusual choice, per §0 Human-in-the-Loop gate
3. Confirms once: "Understood. You'll populate VISION, STACK, DEVELOPMENT_PLAN yourself. I'll review and propose refinements per §21 when you share drafts. Shall I stand by, or help with something else meanwhile?"
4. Respects the decision going forward

This lets experienced founders move fast while ensuring first-timers don't accidentally skip the most valuable step.

### Source docs are living, not frozen

A critical reminder that belongs with the onboarding protocol:

**Draft-1 of VISION.md, STACK.md, DEVELOPMENT_PLAN.md is version 1, not version final.**

As the founder works on the product, understanding deepens — market feedback, rejected hypotheses, pivots, new insights. Every such shift triggers a §21 update proposal. Source-of-truth documents are living, disciplined by §22 (kill-more-than-create, hard size caps). A 6-week-old VISION.md should look different from a day-one VISION.md.

The onboarding protocol produces a solid foundation. The framework's ongoing discipline keeps it current.

### What Cowork does NOT do during onboarding

- Does not draft source docs before briefing is confirmed complete
- Does not propose implementation briefs — no Claude Code hand-off during onboarding
- Does not let the founder skip the "what the product is NOT" question
- Does not accept batched answers to multiple questions at once
- Does not silently pick sides on contradictions surfaced during inventory
- Does not use generic placeholders in drafts when real answers are available from the briefing

---

## 2. Pre-Delivery Self-Check — APPLIES TO BOTH COWORK AND CLAUDE CODE

> **"Before delivering any final prompt, impact suggestion, structural change, or implementation spec — stop and self-check against the Briefing Rules and Universal Debug Rule. If you violated them, fix the deliverable before handing it over."**

**For Cowork — before handing any brief to Claude Code, verify:**
- [ ] Did I describe the symptom + expected behaviour, NOT the implementation?
- [ ] Did I flag the approach as a hypothesis, NOT a prescription?
- [ ] Did I avoid naming specific files, writing code, or defining data structures?
- [ ] Did I include the Universal Debug Rule at the top?
- [ ] Did I leave room for Claude Code to evaluate and choose the best approach?

If any checkbox fails → rewrite the brief before delivering.

**For Claude Code — before shipping any code, verify:**
- [ ] Did I read the actual source files before implementing?
- [ ] Did I validate the brief's hypothesis against what the code actually shows?
- [ ] Did I check for edge cases and workflow conflicts?
- [ ] Did I report back what the actual approach was and whether the hypothesis was right?

If any checkbox fails → stop and complete the missing step before shipping.

---

## 3. Universal Debug Rule — APPLIES TO BOTH COWORK AND CLAUDE CODE

> **"Read the actual code before confirming the fix approach. The hypothesis might be wrong. Always evaluate what is the best approach to fix the bug — find edge cases and current workflow conflicts, and address them too."**

This rule is non-negotiable and applies every time either role investigates or fixes a bug.

**For Cowork (writing briefs):**
- Cowork does NOT audit source code. That is Claude Code's job.
- Cowork describes the symptom, the expected behaviour, and the suspected area — not the specific file or line.
- Never prescribe a specific fix in a brief without flagging it as a hypothesis.
- Always include the instruction: *"Read the actual code before confirming the fix approach. The hypothesis might be wrong. Evaluate the best approach, find edge cases, and address workflow conflicts too."*
- This applies to bug fixes, feature additions, and any update to existing behaviour.

**For Claude Code (implementing fixes, features, or updates):**
- Read every relevant file before writing a single line of code — always, for bugs AND features.
- If the actual root cause or best implementation differs from the brief's hypothesis, use the better approach and report back.
- Before finalising any change, check: does this break existing edge case guards, race conditions, retry logic, or background job patterns already in the codebase?
- Report back to Cowork: (a) what the actual root cause / best approach was, (b) whether the hypothesis was right, (c) any conflicts or edge cases found and how they were addressed.

---

## 4. Access Request Rule — CLAUDE CODE MUST ASK

> **"Always ask the owner if you need any access for evaluation or best-approach fixing. Access includes but is not limited to: hosting / runtime platform (logs, env vars, deployments), database (SQL editor, DB inspection, migrations, replication settings), source control (repo permissions, branch access), API keys (any third-party), production URLs, live test environments, local test devices."**

Non-negotiable. Applies every time Claude Code hits a point where missing access would force it to guess, skip verification, or ship a fix blind.

**What to do:**
- Before starting investigation: if the brief implies access that may not be available locally (prod DB state, runtime logs, deployed env vars, replication settings, physical test devices, etc.), ask first.
- Mid-investigation: the moment you realise you cannot verify a hypothesis without an access you don't have, stop and ask — do NOT ship a fix based on assumptions.
- Before verification: if the only way to confirm a fix works is to run it against prod/staging and you lack access, say so and ask.

**How to ask:**
- Be specific: name the system, the exact thing needed (runtime logs for route X / SQL query on table Y / env var Z / device log Q), and why (what you want to verify or fix).
- Offer alternatives when possible: "I can ship the fix blind, or you can run this command and paste the result — which do you prefer?"
- Never silently proceed with a guess when access would remove the guess.

### Access Tokens Reference

**Do NOT store tokens in this file — it may be committed to source control.**

Tokens live in the project's local secrets file (`.env.local`, `.env`, keychain, or platform equivalent) and are never committed. If the local secrets file doesn't have a needed token, ask the owner — or for dev/test credentials, use the provisioning flow in §4b.

---

## 4b. Automated Credential Provisioning — DEV / TEST ONLY

> **"For dev/test environments, the owner handles all authentication (signup, login, 2FA, payment). Once the owner has opened the relevant API / token panel in their browser, Cowork uses Claude in Chrome to click through the panel, generate the credential, and write it to `.env.local`. Claude Code reads from `.env.local` directly. Neither Cowork nor Claude Code ever sees the owner's passwords, 2FA codes, or authenticated session flows. Production credentials are always handled by the owner manually — never via this flow."**

### The split of labour

| Step | Handled by |
|---|---|
| Signup on a new service | Owner |
| Payment / card entry | Owner |
| Login (email + password) | Owner |
| Email verification, 2FA, CAPTCHA | Owner |
| Navigate to the API / token / key panel in Chrome | Owner |
| Click "Generate key", name it, copy value | Cowork (via Claude in Chrome) |
| Write credential to `.env.local` (read-modify-write) | Cowork (via Claude in Chrome) |
| Read credential at build/test time | Claude Code |
| Detect a dead key (401 / auth failure) and request re-fetch | Claude Code |
| Production credentials | Owner (always manual, never via this flow) |

### The handoff protocol (step by step)

**When Cowork needs a credential:**

1. **Cowork tells the owner exactly what to open.** Specific service name, specific panel URL, specific button the owner needs to reach. Example: *"Please log into Apollo, go to Settings → Integrations → API, and tell me when you're on that page."*

2. **Owner confirms the panel is open.** Short message back: "ready".

3. **Cowork presents the plan, asks for approval once.** The plan must include:
   - Which button(s) Cowork will click
   - What name it will give the new key (e.g. `linkedinright-dev`)
   - Which environment variable name it will write to in `.env.local` (e.g. `APOLLO_API_KEY`)
   - Whether any existing value will be overwritten

4. **Owner approves the plan once** — "yes" / "go".

5. **Cowork executes the plan via Claude in Chrome.** Operates only within the tab the owner opened. Does not navigate to other tabs, other domains, or login pages.

6. **Cowork performs read-back verification — NON-NEGOTIABLE.** Before confirming the provisioning complete, Cowork reports back to the owner:
   - The exact key name created (as shown in the service's UI)
   - The first 8 characters of the generated secret value (enough to identify it, not enough to leak it)
   - The environment variable it was written to in `.env.local`
   - Request: *"Confirm this matches what you see in the panel."*

7. **Owner confirms match.** Short message: "confirmed" / "yes".

8. **Cowork generates the direct handoff prompt for Claude Code.** A ready-to-paste prompt block that tells Claude Code:
   - Which credential just became available and under what variable name
   - Where in the codebase it should be wired up (file hypothesis only — §1 Briefing Rules apply)
   - The Universal Debug Rule line (§3)
   - The Plan-Before-Build instruction (§5)
   - Any integration-specific gotchas Cowork noticed during the provisioning run

9. **Owner copies the prompt and pastes it into Claude Code.** Handoff complete.

### What Cowork does NOT do

- Never requests or accepts a password in chat
- Never requests or accepts a 2FA code in chat
- Never navigates away from the panel the owner opened
- Never interacts with any tab other than the one specified
- Never attempts to automate login forms, even if the owner is logged out
- Never fetches credentials for production environments — dev/test only
- Never commits `.env.local` or any credential file
- Never stores raw secret values in chat memory, briefs, specs, or logs
- Never modifies `.gitignore` to re-include a credential file

### What Claude Code does on a dead credential

1. Detects 401 / 403 / auth failure during build or test
2. Stops and reports to the owner: *"`<VAR_NAME>` appears to be failing against `<service>`. Please re-run provisioning via Cowork."*
3. Does NOT attempt to regenerate the key itself — Claude Code does not drive the browser
4. Waits. Resumes when `.env.local` is updated and the owner confirms

### Read-modify-write discipline on `.env.local`

`.env.local` may contain values the owner added manually. When Cowork writes a new credential via Claude in Chrome, it:
- Reads the current contents of `.env.local` first
- Adds or updates only the specific variable it was provisioning
- Preserves all other existing lines exactly (including comments and blank lines)
- Never overwrites the entire file

This is the §9 Data-Layer Merge Rule applied to the credentials file.

### Honest caveats

- Claude in Chrome is beta. Service UIs change. The first provisioning run against any new service should be watched closely.
- The read-back verification step (point 6 above) is the insurance that catches silent failures — if the first 8 chars don't match what the owner sees, the provisioning is rejected and retried.
- This flow assumes a paid Claude plan with Claude in Chrome enabled (Max, Team, or Enterprise for full model access). On Pro, browser automation runs on Haiku 4.5 and may fumble more complex panels.

---

## 5. Plan-Before-Build Rule — CLAUDE CODE MUST ASK BEFORE CODING

> **"Before writing a single line of code on any non-trivial brief, Claude Code must present a short plan + a concrete list of questions and confirmations to the owner, and wait for answers. Do not start implementing until the open questions are resolved."**

Non-negotiable. Applies to every brief that involves any of: a data model change (DB migration, new column / table / index, schema change, storage format change), a new file, a destructive change, a rename, a backfill, a prompt rewrite that removes existing behaviour, a protocol or interface change, or any decision where more than one reasonable approach exists.

**What the pre-build message must contain:**

1. **Where the relevant code lives** — short, concrete pointer to the file(s) and line(s) Claude Code actually read, so Cowork can see the hypothesis is grounded in the real code, not the brief.
2. **Proposed plan** — numbered steps: what changes, in which file, and why. Include the exact write path, render path, and edge cases covered. Keep it tight — bullet list, not prose.
3. **Access / confirmation questions** — an explicit, numbered list of every decision the owner needs to make before Claude Code can safely proceed. Each question must:
   - Name the specific system or decision (e.g. "DB migration — happy for me to add column X to table Y?")
   - Offer the alternatives when more than one exists (e.g. "column name — `example_text` or `strong_answer_example`?")
   - Spell out the trade-off (e.g. "backfill script will cost ~N API calls — worth it, or accept the placeholder until re-save?")
   - Flag anything that needs the owner's hands on a tool Claude Code can't reach (SQL editor, hosting env, API keys, device console)
4. **Shippable-in-isolation flag** — if any part of the brief can ship independently without the open questions resolving, say so, so the owner can unblock that part while thinking about the rest.

**What NOT to do:**
- Do not start writing code "while waiting" for answers — the answers may invalidate the approach.
- Do not bundle the questions at the bottom of a long implementation message. They go at the top, before any code.
- Do not skip the plan because the brief feels clear — the brief is a hypothesis, the plan is what Claude Code actually intends to build after reading the code.
- Do not ask vague questions ("is this ok?"). Ask specific, answerable ones with alternatives.

**Reference template:**

```
## <Task/Bug> — plan
Where the current behaviour lives: <file:line pointer>.
Proposed implementation:
1. <step>
2. <step>
...

## Access / confirmation needed before I proceed
1. <specific question with alternatives>
2. <specific question with alternatives>
3. <specific question with alternatives>

Once you answer these, I'll ship <scope> in <N> commits. <Independent scope> can ship right now if you want it first.
```

This rule layers on top of the Universal Debug Rule (read code first) and the Access Request Rule (ask for access when blocked) — together, the three rules define how Claude Code starts every non-trivial task.

---

## 6. Fail-Open Rule — ALL NEW ENTRY POINTS AND BACKGROUND PROCESSES

> **"Every new entry point (API route handler, event listener, IPC handler, command handler, scheduled job) and every background process must fail-open: catch the error, log a warning, and let the calling flow continue. Never throw uncaught exceptions that block the user's main interaction."**

Non-negotiable. Applies to every new route, every side-effect hook, every background job, every fire-and-forget write (analytics, telemetry, embeddings, tag writes, cache warming).

**Pattern (language-agnostic):**
```
try {
  await doTheWork()
} catch (err) {
  log.warn('[ComponentName] descriptive message — main flow continues', err)
  // do NOT re-throw
}
```

**Why:** A failure in a background or secondary process must never block the user's primary interaction. The primary flow must still succeed even if the background work fails.

**For Claude Code — before shipping any new entry point or side-effect:**
- [ ] Is every async operation wrapped in try/catch (or the language's equivalent)?
- [ ] Does the catch block log a `[ComponentName]` prefixed warning with a description of what failed?
- [ ] Does the catch block NOT re-throw (so the calling flow continues)?
- [ ] Is the route or process genuinely independent enough to fail without breaking the user?

---

## 7. Background Work Rule — USE THE PLATFORM'S SAFE PRIMITIVE

> **"Any work that must happen after a response has been sent, after a user action, or outside the main request lifecycle (background jobs, cascading writes, analytics, embeddings, sync) must use the platform's designated background primitive. Never use a fire-and-forget async call after the main lifecycle has ended — it dies silently on most runtimes."**

**Why:** On most serverless, mobile, and desktop runtimes, the execution context terminates or freezes the moment the main lifecycle ends (response flushed, user navigates away, app backgrounded). Fire-and-forget async work dies silently — it logs nothing, writes nothing, and gives no indication it was killed. The platform's designated background primitive is the safe pattern.

**Examples of the right primitive for common platforms:**

| Platform | Safe primitive |
|---|---|
| Next.js (serverless) | `after()` from `next/server` |
| AWS Lambda | SQS / SNS / DLQ / Step Functions |
| Cloudflare Workers | `ctx.waitUntil()` |
| Electron main process | IPC-triggered background worker / queue |
| Electron renderer | Main-process IPC call, not renderer `setTimeout` |
| iOS | `BGTaskScheduler` / background modes |
| Android | `WorkManager` |
| Python web apps | Celery / RQ / platform equivalent |
| Node long-running | BullMQ / proper worker queue |

**Wrong pattern (never rely on this after main lifecycle ends):**
```
;(async () => {
  await doBackgroundWork()  // silently dies
})()
```

**For Claude Code — before shipping any post-main-lifecycle work:**
- [ ] Is this using the platform's designated background primitive?
- [ ] Is the background callback wrapped in try/catch (fail-open)?
- [ ] Is there any remaining fire-and-forget async call in the same file? (grep and check)
- [ ] If the runtime doesn't have a native primitive, is there an explicit queue/worker doing the work?

---

## 8. Structured Output Reliability — NEVER TRUST THE LLM FOR FIELDS THE CODE KNOWS

> **"If the caller (server or client) can determine a field independently from its own state (DB, routing table, session context, local state), the CODE writes it — don't ask the LLM to include it in structured output. LLMs intermittently drop fields during JSON assembly. Prompt enforcement increases probability but never reaches 100%. Code is deterministic."**

**Three rules:**

1. **Code writes fields it knows.** If the caller has the value (current question ID, user ID, session context, timestamp, request ID), the caller injects it into the LLM's structured output at the save boundary. The LLM never needs to include it. No prompt instruction, no salvage, no intermittent failure.

2. **LLM only decides what code can't determine.** Content type (the LLM chose option A vs option B). Content body (the actual text / judgment). These are judgment calls only the LLM can make. Everything else is code-injected.

3. **Test the data, not just the UI.** When a piece of data is missing, the UI often looks normal — the user clicks through and nothing appears broken. Always check logs and query the underlying store for the actual payload. A clean UI doesn't mean a clean record.

**For Claude Code — before shipping any LLM-structured output:**
- List every field the output requires
- For each field: can the caller determine this from its own state?
- If yes → caller injects it. Don't add it to the prompt instruction.
- If no → LLM must provide it. Add parser validation as safety net.

**Corollary — prompt-only fixes are structurally insufficient for mandatory fields.** If an LLM drops a mandatory field once, assume it will drop it again despite 6 prompt reinforcements. Move the field to code-side injection.

---

## 9. Data-Layer Merge Rule — NEVER REPLACE, ALWAYS MERGE

> **"When writing to any accumulating data container (JSONB column, nested object, metadata blob, settings record, cache entry), always fetch the existing value first and merge new keys into it. Never write a fresh object that would overwrite existing keys."**

**Why:** Accumulating containers often collect multiple independent keys over time, written by different routes / modules at different times. If any writer replaces the whole object instead of merging, it silently wipes the other keys. The bug is invisible — the write succeeds, the UI shows nothing wrong, but downstream features silently lose data.

**Correct pattern (language-agnostic):**
```
// Fetch current value first
existing = store.read(key)
current = existing ?? {}

// Merge new key(s) in
store.write(key, { ...current, new_key: new_value })
```

**For Claude Code — before shipping any write to an accumulating container:**
- [ ] Does the write fetch the current value first?
- [ ] Does it preserve existing keys via merge / spread?
- [ ] Are there any other writers touching the same container that could race? (If yes, flag to the owner.)

---

## 10. Ship-Clean Rule — TYPECHECK / COMPILE + LINT BEFORE EVERY COMMIT

> **"Run typecheck/compile and lint before shipping any commit. Zero new type / compile errors. Zero new lint warnings — the pre-existing baseline must not increase."**

**Why:** Type errors and lint warnings from one commit can block subsequent commits from deploying or running. Shipping clean is non-negotiable.

**What to run (adapt to the project's toolchain):**
```
# TypeScript / JS
npx tsc --noEmit
npx eslint .   (or npx next lint)

# Python
mypy .
ruff check .

# Go
go vet ./...
staticcheck ./...

# Rust
cargo check
cargo clippy -- -D warnings

# Swift / Kotlin / other
<project's standard build + lint commands>
```

**For Claude Code — before every commit:**
- [ ] Did the type/compile check exit with 0 errors?
- [ ] Is the lint problem count ≤ pre-existing baseline (do not add new warnings)?
- [ ] If the lint count went UP: identify which new file introduced the warnings and fix them before committing.

**Baseline discipline:** Track the project's lint baseline in this file (e.g. "Lint baseline: N problems as of <date>"). Every commit notes the new count. If the count drops, update the baseline. If it rises, don't ship.

---

## 11. Secret Hygiene

**Do NOT store API keys, DB credentials, or access tokens in this file or any committed file.**

Standard hygiene:
- Local secrets file (`.env.local`, `.env`, keychain, or platform equivalent) for all secrets, gitignored
- `.gitignore` covers secret file variants (`.env*`, `.env.local`, `.env*.local`, `secrets/`, etc.)
- Before every push: grep tracked files for credential patterns — must return empty
- Never paste secrets into briefs, chat, or specs
- If a secret is ever committed: rotate it immediately, then clean the history

---

## 12. Live-Test Discipline

Every non-trivial feature ships with a re-test checklist BEFORE Claude Code moves to the next task:

1. **Numbered checklist** — specific, verifiable steps the owner can run (not vague "check it works")
2. **Happy path first** — the most common user flow
3. **Edge cases** — malformed inputs, rapid clicks, page reloads, network failures, app backgrounding, offline mode
4. **Data verification step** — don't trust the UI; query the underlying store (DB, local storage, file system) to verify the actual write
5. **Regression check** — confirm prior features still work
6. **Negative test** — confirm the fix doesn't accidentally fire in unintended contexts

**Feature is not "done" until the live-test checklist has been run and passed.** "Done" means tested in production or staging (or on the target device for local apps), not "tests pass locally on my machine."

---

## 13. Iterative Development Pattern

For any multi-part feature (3+ components, N migrations, phased rollout):

1. **Ship one piece at a time** — do not batch ship until each piece is live-tested
2. **Each piece gets its own commit** — atomic, reviewable, revertable
3. **Live test after every commit** — do not start piece N+1 until piece N passes
4. **Document the commit + what it does + verification status** in this file
5. **Architecture / pattern decisions documented separately** from commit log so they can be referenced across future work

**Why:** Large multi-part features where every piece ships at once are high-risk. One bug in piece 3 can block pieces 4–10. One-piece-at-a-time keeps the blast radius small and every regression attributable.

---

## 14. Spec-Before-Implementation Pattern

Before Claude Code writes implementation code for a major feature:

1. **Owner writes the spec** (via Cowork) — what the feature is, what it does, what the inputs/outputs are, what the edge cases are
2. **Owner reviews the spec as a suite** alongside any adjacent specs — cross-layer consistency, contracts between modules, interface compatibility
3. **Spec gate** — owner explicitly confirms the spec suite is approved before any code is written
4. **Claude Code receives a consolidated master brief** — references the specs, universal rules, and any relevant context

**Why:** Implementation reveals gaps in specs. But fixing gaps mid-implementation costs more than fixing them pre-implementation. The spec gate surfaces gaps before code touches them.

**Spec naming convention:** Use a monotonically increasing ID (D1, D2, ...) or date-based naming so you can reference specs unambiguously in briefs and logs. Retire superseded specs with a clear pointer to the replacement.

---

## 15. Session Logging Pattern

Maintain a session log in this file (or a linked file) with:

- **Session number + date + scope** — one-line header
- **What shipped** — commit hashes + what each did
- **What's pending** — explicit TODO list carried forward
- **Current state** — what is live, what is in-progress, what is blocked
- **Decisions made** — architecture, naming, retires — with rationale

**Why:** Multi-week / multi-month projects accumulate context that no one can hold in their head. The session log is the project's memory. If a decision was made and the rationale is not logged, the decision will be re-litigated and sometimes reversed.

**Session log hygiene:**
- Date every entry
- Link commits by hash
- Mark superseded decisions as SUPERSEDED with a pointer to the replacement — do not delete
- Keep a "Current State" summary at the top that is updated every session (not just appended)

---

## 16. Retirement Discipline

When a spec / file / pattern / architecture is replaced by a new one:

1. **Mark the old one RETIRED** in the spec index (do not delete)
2. **Point to the replacement** — so anyone finding the old spec knows where to look
3. **Note the date of retirement** and the session that did it
4. **Do not send retired specs to Claude Code** — they will confuse implementation

**Why:** Deleted specs leave dangling references in briefs, commits, and chat history. RETIRED specs with pointers let future readers (including future-you) follow the trail.

---

## 17. Status Discipline in Documentation

Every feature in the status table uses one of these exact statuses:

- ✅ **DONE** — shipped, live, tested
- 🟡 **IN PROGRESS** — actively being worked on this session
- 🔴 **PENDING** — queued, not started
- ⛔ **BLOCKED** — waiting on another task / decision
- 🚫 **RETIRED** — superseded, do not work on

**Why:** Ambiguous statuses ("mostly done", "almost there", "needs a bit more work") accumulate and create invisible debt. Exact statuses force honesty.

---

## 18. Known-Failure-Mode Log

As live testing reveals recurring patterns of failure, log them here so they're caught earlier next time. Each entry:

- **Failure mode** — one sentence
- **Root cause** — not the symptom
- **Prevention** — what rule / check catches it before it ships
- **Example** — commit / session where it first appeared

This is how tribal knowledge gets encoded. Every bug that took more than one session to find should end up here.

---

## 19. Known Recurring Failure Modes (Cross-Project Patterns)

These patterns have shown up across enough projects to be worth catching by default:

| # | Failure Mode | Root Cause | Prevention |
|---|---|---|---|
| 1 | Background job dies silently after main lifecycle ends | Fire-and-forget async call after response / action / app background | Background Work Rule (§7) |
| 2 | LLM drops a mandatory structured field despite prompt enforcement | LLMs are not deterministic at the field level | Structured Output Reliability (§8) |
| 3 | New writer overwrites existing accumulating-container data | Writing whole object instead of merging | Data-Layer Merge Rule (§9) |
| 4 | Uncaught exception in analytics / embedding / tag-write blocks user's primary action | Not wrapping background side-effects in try/catch | Fail-Open Rule (§6) |
| 5 | Type / compile error in commit N blocks deploys of commits N+1..N+5 | Not running typecheck before push | Ship-Clean Rule (§10) |
| 6 | Cowork prescribes specific files / code shapes; Claude Code implements blindly; root cause was different | Briefing violates §1 Briefing Rules | Pre-Delivery Self-Check (§2) |
| 7 | Fix shipped based on hypothesis without reading code; real root cause was elsewhere | Skipping the Universal Debug Rule | §3 + §5 Plan-Before-Build |
| 8 | Claude Code ships blind when verification needs prod / device / platform access | Not asking for access | Access Request Rule (§4) |
| 9 | "Clean UI" masks missing data in the underlying store | Not verifying the actual write | Live-Test Discipline (§12) data verification step |
| 10 | Multi-part feature ships all at once; bug in piece 3 blocks pieces 4–N | Not iterating one piece at a time | Iterative Development Pattern (§13) |
| 11 | Credential written to a non-gitignored file and committed to repo | Cowork wrote to a file outside `.env.local` / `.credentials/*`, or `.gitignore` missed the pattern | §4b read-back verification + §11 Secret Hygiene grep-before-push |
| 12 | Provisioning run appears successful but credential value is wrong (stale clipboard, wrong dropdown clicked) | Skipped the read-back verification step | §4b step 6 — non-negotiable read-back of first 8 chars before confirming done |
| 13 | Same decision re-litigated every 4-6 weeks | No ADR was written; rationale lives only in fuzzy memory | §20 Source Discipline + ADRs in `decisions/` |
| 14 | Cowork confidently answers a question about past decision, gets it wrong | Answering from memory instead of source docs | §20 — always cite the source doc or flag absence |
| 15 | Source-of-truth doc bloats past usefulness (VISION.md becomes 40 pages) | No size cap enforcement; every update adds, never subtracts | §22 Bloat Discipline + kill-more-than-create rule |
| 16 | Investigation reveals a fixable bug; Claude Code silently fixes it in the same response | Investigation/implementation mixed in one brief | §1b Investigation Loops — no silent transitions, implementation is a separate brief |
| 17 | Same investigation question asked twice in different sessions | No investigation log kept; Cowork has no memory of prior findings | §1b investigation hygiene — log each investigation to session log |
| 18 | Founder starts coding before VISION/STACK are populated | Cowork didn't detect new-project state and run onboarding | §1c New Project Onboarding Protocol — automatic trigger on empty source docs |
| 19 | Onboarding briefing drafts source docs with placeholder content because founder wasn't asked the right questions | Briefing was batched / rushed / skipped topics | §1c standard briefing sequence — one question at a time, don't skip "what the product is NOT" |

---

## 20. Source Discipline — ANSWER FROM DOCUMENTS, NOT MEMORY

> **"Cowork and Claude Code answer questions about product, architecture, data model, prompts, or past decisions by reading from the relevant source-of-truth document — not by reasoning from memory or conversation history. If no source document covers the question, propose writing one (ADR, feature spec, etc.) before committing to a definitive answer."**

This rule makes the whole source-of-truth system actually work. Without it, the documents exist but aren't used, and Cowork/Code answer from fuzzy recall instead of ground truth.

**The source-of-truth layout:**

```
<project-root>/
├── CLAUDE.md                  # These rules
├── SOURCE_INDEX.md            # One-page index of all source docs + status
├── TESTING.md                 # Testing philosophy (stable, rarely changes)
├── product/
│   ├── VISION.md              # Why + what (500 words hard cap)
│   └── FEATURES/              # D1-*.md, D2-*.md per feature (2pp cap each)
├── architecture/
│   ├── STACK.md               # Tech choices + reasoning (500 words cap)
│   ├── SYSTEM.md              # Component map (3 pages cap, split if larger)
│   └── DATA.md                # Schema with semantic meaning
├── prompts/                   # One file per prompt, in-file versioned
├── decisions/                 # ADR-NNN-<title>.md, 1pp each
├── source-materials/          # Original uploaded fragments (not authoritative)
└── snapshots/                 # Milestone snapshots only (pre-pivot, etc.)
```

**At the start of every session — BOTH COWORK AND CLAUDE CODE MUST:**

- [ ] Read `SOURCE_INDEX.md` first
- [ ] Read the 3 source documents most relevant to today's topic
- [ ] Flag any document marked stale or not reviewed in 90+ days before relying on it

**When asked a question about product, architecture, or past decisions:**

- [ ] Cite the specific source document and section the answer comes from
- [ ] If no source document covers it, say so explicitly: *"This isn't in any source document. We should either (a) write an ADR for this decision now, or (b) I can give you my reasoning but it shouldn't be treated as settled."*
- [ ] Never fabricate a confident answer from memory when a source document should exist but doesn't

**Contradiction surfacing — NON-NEGOTIABLE during initial dump-and-organise:**

When the owner uploads scattered project materials, Cowork's first job is to flag conflicts between documents — not just deduplicate. Explicit output required:

```
Found these contradictions in your uploaded materials:
1. File A says "target small SaaS" (dated 2026-01-15)
   File B says "target mid-market" (dated 2026-03-02)
   Which is current?
2. File C lists Postgres as the DB; File D lists MongoDB.
   Was there a migration? Which one shipped?
```

No silent picking. Force the decision moment.

---

## 21. Update Protocol — PROPOSE, DON'T WRITE SILENTLY

> **"Cowork and Claude Code never update a source-of-truth document silently. They propose updates in a fixed shape, wait for owner approval, and only then apply the diff. Proactive proposal is required; autonomous editing is forbidden."**

### The three commitment triggers

Cowork proposes an update only when **at least one** of these signals is present in the conversation:

1. **Language of decision** — "let's do X", "we'll go with Y", "that's settled", "final call", "approved"
2. **Explicit scoping** — "okay, feature X will do A, B, and C" (a feature spec is being defined, not mused about)
3. **Resolved contradiction** — the conversation resolves a conflict with what an existing source doc says, and the doc is now wrong

**Absent any of these signals**, Cowork stays in exploration mode and does NOT propose updates. Musing, brainstorming, and hypothetical exploration are not triggers. "We should think about using Redis" is not a trigger. "Let's add Redis to the stack" is.

### The fixed proposal shape — NON-NEGOTIABLE

Every update proposal uses exactly this shape. Not prose. Not hedged. This shape:

```
PROPOSED UPDATE

File:     <path/to/file.md> (section <N>)
Type:     MODIFY | CREATE | RETIRE
Reason:   <one sentence: what triggered this>
Adding:   <bullet list: what's new>
Removing: <bullet list: what's outdated or being cut>
Net:      <+N or -N words>

<diff block showing exact before/after>

Approve? [y / n / edit]
```

### What the owner does

- `y` — Cowork applies the diff (or hands over a ready-to-paste block if in a context without write access)
- `n` — Proposal is rejected. Cowork moves on. No record kept of rejected proposals (they're not decisions).
- `edit: <suggestion>` — Cowork revises and re-proposes

### Batch mode

At the end of a working session, Cowork may collect multiple proposals and present them as a batch. Owner approves/rejects each. This is preferred over interrupting flow mid-conversation for trivial updates.

### The calibration period (first 2-4 weeks of a new project)

For the first 2-4 weeks, every proposal includes a fourth line:

```
Why I'm proposing this: <one sentence explaining the trigger match>
```

This lets the owner correct miscalibration: *"That wasn't a decision, we were just exploring"* or *"You should have proposed this earlier — when I said X"*. After ~10 corrections, the "why" line can be dropped.

---

## 22. Bloat Discipline — KILL MORE THAN YOU CREATE

> **"Source-of-truth documents have hard size caps. Every update proposal must show what's being removed alongside what's being added. Net growth over time is monitored and aggressively pruned. A bloated source document is worse than a thin one — it stops being read."**

### Hard caps per document type

| Document | Hard cap | If exceeded |
|---|---|---|
| `VISION.md` | 500 words | Split positioning into separate doc, or ruthlessly cut |
| `STACK.md` | 500 words | Move reasoning to ADRs, keep list + one-liner per tech |
| `SYSTEM.md` | 3 pages (~1500 words) | Split into `architecture/COMPONENTS/*.md` |
| Feature spec (D*) | 2 pages | Split into sub-specs or scope-cut the feature |
| ADR | 1 page | If you need more, it's not an ADR — it's a design doc |
| Prompt file | No word cap | But must include version, changelog, last eval result |
| `SOURCE_INDEX.md` | 1 page | Summarise categories, don't enumerate every ADR |

**When Cowork hits a cap on a proposed update:** it stops adding and proposes consolidation instead. *"VISION.md is at 480 words. My proposed edit would push it to 620. Instead, I suggest removing the 'early market hypothesis' paragraph (now superseded by ADR-004) and adding the new positioning line. Net change: -30 words."*

### Kill-more-than-create rule

Every `MODIFY` proposal must have a non-empty `Removing:` line. If nothing is being removed, the proposal must explicitly justify why pure addition is warranted.

**Default posture:** when adding new information, look first for what can be cut. Outdated rationale, superseded decisions, duplicated content across docs.

### Automatic pruning triggers

Cowork proposes pruning when:

- **ADR marked RETIRED** → propose removing references to it from other docs, keeping only a pointer
- **Feature spec ✅ DONE for 30+ days** → propose summarising it down to one paragraph in `product/FEATURES/_shipped.md`, archiving the full spec in `product/FEATURES/_archive/`
- **Prompt bumped to new version** → propose moving v(N-2) and older into a `prompts/_archive/` section within the same file, keeping only the two most recent versions active in the live section
- **Quarterly freshness pass (every 90 days)** → Cowork picks 5 source documents and asks the owner "still accurate?" Owner reviews in ~15 minutes, marks stale content for pruning

### Versioning — three tiers, no more

**Tier A — ADRs version by supersession.** Never edit an accepted ADR. If a decision changes, write a new ADR (ADR-N+1) and mark the old one 🚫 RETIRED with a one-line pointer. Both stay in `decisions/` forever.

**Tier B — Prompts version in-file.** Each prompt file contains up to two active versions (current + previous) with changelog and last eval result. Older versions move to an `_archive/` section or file, never deleted.

**Tier C — Everything else snapshots at milestones only.** No per-edit version history. At real milestones (pre-pivot, pre-rewrite, pre-funding, pre-team-handoff), Cowork proposes copying live docs to `snapshots/YYYY-MM-DD-<label>/`. Git commits cover ordinary edit history.

**Explicitly NOT versioned:** VISION, STACK, SYSTEM, DATA, feature specs in active development, SOURCE_INDEX.md. These live in current state only; Git covers history.

---

## 23. Project-Specific Context

> **Replace this block in each new project. Everything above this line is universal. Everything below this line is project-specific. Do not edit anything above §23 — if a rule feels wrong for this project, discuss it with the owner before changing the universal layer.**

**Project:** Upwork Bid Bot (internal name: HestaBit Bid Bot)
**Owner:** Dipanshu (dipanshuupadhyay@gmail.com)
**Stack:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + pgvector + Auth) + Gemini 2.5 Pro API + Gemini text-embedding-004 + Vercel
**Repo:** [URL — to be added once GitHub repo is created]
**Lint / typecheck baseline:** [To be established after Phase 1 setup]

### Stack-specific adaptations

- **Background work primitive for this stack:** Next.js `after()` from `next/server` for any post-response work. Pipeline runs sequentially in a single API route — each bot call awaits the previous before starting.
- **Ship-clean commands for this stack:**
  ```
  npx tsc --noEmit
  npx next lint
  ```
- **Access tokens / credentials list (Claude Code requests these via §4):**
  - `GEMINI_API_KEY` — Google AI Studio API key for Gemini 2.5 Pro + embeddings
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public)
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only, never exposed to client)
- **Test / staging environment:** Vercel preview URL (auto-generated per branch). No separate staging environment in v1.
- **Key external services:**
  - Supabase — auth, proposals table, portfolio table + pgvector
  - Google AI (generativelanguage.googleapis.com) — Gemini 2.5 Pro for pipeline, text-embedding-004 for portfolio retrieval
  - Vercel — hosting + serverless functions

### Pipeline architecture note

The 8-bot pipeline runs sequentially server-side. Each bot is a Gemini API call. State is passed explicitly as text between bots (mirrors the current `{{state.output_persona}}` pattern from OpenAI). Output streams to the client via Server-Sent Events (SSE) — each bot's output is flushed to the chat UI as it completes (ADR-001).

The Portfolio Facts Bot step uses pgvector semantic search against the Supabase portfolio table instead of the OpenAI vector store.

### Source of Truth

The authoritative source-of-truth documents for this project live in the folder structure defined in §20. See `SOURCE_INDEX.md` in the repo root for the current inventory and status of each document. Always consult SOURCE_INDEX.md before answering questions about product, architecture, or past decisions (§20 Source Discipline).

### Session History

**Session 1 — 2026-04-22**
Scope: New project onboarding. Full pipeline documented (8 bots, all prompts reviewed, 4 sample proposals reviewed). Source-of-truth documents drafted and approved: VISION.md, STACK.md, DEVELOPMENT_PLAN.md, ADR-001, ADR-002, ADR-003, SOURCE_INDEX.md, CLAUDE.md §23.
Decisions made: Gemini 2.5 Pro as AI engine, Supabase + pgvector for portfolio retrieval, streaming output (ADR-001), proposal history (ADR-002), no rate limiting v1 (ADR-003).
Status: Blocked on credentials. Next action: Dipanshu creates GitHub + Vercel + Supabase accounts and provisions credentials for Claude Code.

### Document Suite

| ID | Type | Title | Status |
|---|---|---|---|
| ADR-001 | Decision | Pipeline output display — streaming per bot | ✅ Accepted |
| ADR-002 | Decision | Proposal history — save per user in Supabase | ✅ Accepted |
| ADR-003 | Decision | Rate limiting — none in v1 | ✅ Accepted |
| DP-01 | Phase plan | Foundation | 🔴 pending |
| DP-02 | Phase plan | Pipeline Engine | 🔴 pending |
| DP-03 | Phase plan | Chat UI | 🔴 pending |
| DP-04 | Phase plan | Proposal History | 🔴 pending |
| DP-05 | Phase plan | Hardening | 🔴 pending |

### Current State

**Live:** Nothing yet — build not started.
**In progress:** Nothing — waiting on credentials.
**Blocked:** Need GitHub repo + Vercel project + Supabase project + Gemini API key from Dipanshu before Claude Code can start Phase 1.

### Build Status Table

| Feature | Status |
|---|---|
| GitHub repo + Vercel project setup | 🔴 pending |
| Supabase schema (users, proposals, portfolio) | 🔴 pending |
| Portfolio ingestion script (docx → structured records → embeddings) | 🔴 pending |
| Admin UI — add/edit portfolio items | 🔴 pending |
| Gemini pipeline (8 bots sequential, SSE streaming) | 🔴 pending |
| Chat UI (real-time bot output display) | 🔴 pending |
| Auth (login page, protected routes) | 🔴 pending |
| Proposal history (save + view + copy) | 🔴 pending |
| Error handling + cost monitoring | 🔴 pending |
| Production config + domain | 🔴 pending |
