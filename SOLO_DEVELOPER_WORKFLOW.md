# SOLO_DEVELOPER_WORKFLOW.md

**Purpose:** The practical day-to-day workflow for a solo developer building a product with the Shark framework, using Claude Desktop (for Cowork) and Claude Code (for implementation).

**Audience:** You — working alone, across multiple products, on a single machine.

**Read time:** 7 minutes.

---

## 1. The two-tool split

You run two Claude tools side by side:

| Tool | Role | Where it runs | What it does |
|---|---|---|---|
| **Claude Desktop** (Cowork) | Strategist | Anthropic's desktop app | Specs, briefs, ADRs, doc updates, decisions |
| **Claude Code** | Implementer | Terminal / VS Code | Reads code, writes code, runs tests, ships commits |

**The golden rule:** Cowork thinks. Claude Code codes. The two never mix roles.

If Cowork starts writing code, stop it — that's Claude Code's job.
If Claude Code starts making strategic product decisions, stop it — that's Cowork's job.

---

## 2. How the two tools connect

Three connection layers:

**1. Same filesystem (shared documents)**
Both tools read from the same repo folder. Claude Code reads files directly (it lives in the terminal, on disk). Claude Desktop reads the same files via the project's Knowledge (you upload them once at project start, re-upload after major updates).

**2. Claude in Chrome (the browser bridge)**
When Cowork needs to fetch credentials from a web-based panel, it uses Claude in Chrome to click through. When Claude Code needs to test a web app, it uses Claude in Chrome to drive the browser. Same extension, used by both.

**3. You, the human, in between**
The primary connection between Cowork and Claude Code is **you copy-pasting briefs**. Cowork drafts a brief → you copy it → paste into Claude Code. Claude Code responds → if it's a question for Cowork, you copy it back. Deliberate friction. This is where §0 Human-in-the-Loop lives.

---

## 3. The trigger-driven rhythm

Updates happen when triggers fire, not on a time-of-day schedule. Per §21, these are the commitment triggers:

1. **Language of decision** — "let's do X", "we'll go with Y", "that's settled"
2. **Explicit scoping** — "feature X will do A, B, and C"
3. **Resolved contradiction** — a conflict with an existing source doc is resolved

When a trigger fires during conversation, Cowork proposes the update immediately. You approve in 30 seconds. Work continues.

**What this means in practice:** a two-hour working session might produce 5-10 update proposals, each reviewed in real-time. Not 10 proposals at the end of the session. Real-time capture is non-negotiable.

---

## 4. Opening a new session

### In Claude Desktop (Cowork)

Open the project for whichever product you're working on today. First message of the session:

```
Start-of-session refresh. Re-read:
- CLAUDE.md §0, §20, §21, §22 (the load-bearing rules)
- SOURCE_INDEX.md (what documents exist)
- DEVELOPMENT_PLAN.md (where we are in the journey)

Confirm loaded. Then tell me: what's the current phase, what's 
the active workstream, and what's the most recent decision 
(ADR) recorded.
```

Expected response: Cowork confirms the rules, cites the current phase from DEVELOPMENT_PLAN, lists the most recent ADR. Takes 30 seconds. If it can't do this, the project knowledge isn't loading — re-upload the files.

Then tell Cowork what you want to work on today.

**Special case: brand-new project.** If this is the very first session in a fresh Cowork project where VISION, STACK, and DEVELOPMENT_PLAN are all 🔴 pending, Cowork will automatically trigger §1c New Project Onboarding Protocol instead of waiting for you to drive. Just send "hi" or any message — Cowork will take over and prompt you for existing materials, then run one-question-at-a-time briefing until the source docs can be drafted. You don't need to know the phase names or invoke anything manually.

### In Claude Code

In the terminal:

```bash
cd ~/path/to/product-repo
claude
```

First message:

```
Read CLAUDE.md and SOURCE_INDEX.md. List the source docs and 
the rules that govern our work. Confirm you're ready.

The current phase is [DP-NN — name]. The next workstream is [X].
```

Claude Code reads the files, confirms. Now both tools are loaded with the same context.

---

## 5. The conversation loop during work

Four micro-loops run throughout a session. Here's each, with the trigger and the response:

### Loop A: Exploration

You and Cowork explore a topic. No decisions yet. No triggers. Cowork asks one question at a time (per your collaboration protocol), you answer, you both think.

**No updates are proposed during exploration.** Cowork stays out of update mode until a commitment trigger fires.

### Loop B: Decision reached → ADR proposal

You say "okay, let's go with Postgres." Trigger fires. Cowork proposes:

```
PROPOSED UPDATE

File:     decisions/ADR-008-postgres-as-primary-db.md
Type:     CREATE
Reason:   Language of decision — "let's go with Postgres"
Content:  [draft of the ADR — 1 page, following template]

Also updating:
File:     SOURCE_INDEX.md
Type:     MODIFY (Decisions table)
Adding:   row for ADR-008

Approve? [y / n / edit]
```

You say `y` or `edit: [adjustment]`. Approved diff is applied. Work continues.

### Loop C: Feature scoped → feature spec proposal

You say "feature X will take an email, enrich via Apollo, save the enriched record, and trigger a follow-up." Trigger fires. Cowork proposes a new `product/FEATURES/DN-feature-name.md` using the template. Review, approve, move on.

### Loop D: Ready to implement → brief for Claude Code

When a feature spec is approved and you're ready to build, ask Cowork:

```
Draft the implementation brief for Claude Code for [feature spec].
```

Cowork produces a ready-to-paste block that includes:
- Symptom + expected behaviour
- Hypothesis (flagged as such)
- Universal Debug Rule line (§3)
- Plan-Before-Build instruction (§5)
- Access reminders (§4, §4b)
- Pointer to which source docs Claude Code should read first

You copy, paste into Claude Code. Claude Code responds with its plan and questions (§5 Plan Gate). You answer. Code gets written.

When Claude Code is done, paste the summary back into Cowork. Cowork checks the output against §2 (Pre-Delivery Self-Check) and §12 (Live-Test Discipline), and may propose updates to the feature spec's status, implementation log, or post-ship summary.

### Loop E: Cowork needs code facts → investigation loop (§1b)

This is the pattern where Cowork uses Claude Code as a research instrument, not an implementer.

You ask Cowork a strategy question. Cowork checks source-of-truth docs. If the docs don't cover it *and* the answer depends on actual code behaviour, Cowork doesn't guess — it opens an investigation loop.

**The flow:**

1. Cowork justifies the investigation in one sentence ("Investigation needed because [doc] doesn't cover [topic], and the strategy decision depends on actual behaviour")
2. Cowork drafts an investigation brief — the INVESTIGATION shape from §1b, explicitly scoped, explicitly forbidding code changes
3. You copy the brief, paste into Claude Code
4. Claude Code reads the specified files, answers in the mandatory structured response format (Question / Answer / Source / Confidence + Flagged follow-ups + Uncertain items)
5. You copy Claude Code's response, paste back to Cowork
6. Cowork uses the findings to answer your original strategy question
7. **Cowork runs the findings → doc update pathway automatically** (§1b): for each finding, decide whether a source doc should be updated. Proposes updates via §21 for any that warrant it

**Rules when using this loop:**

- Never let Cowork skip the justification step — if Cowork can't articulate why an investigation is needed, it shouldn't open one
- Never let Claude Code silently fix something during investigation — if it volunteers a fix, say "flag it in your response, don't fix it" and redirect to a separate implementation brief
- Always expect the structured response format — if Claude Code returns prose instead of the Question/Answer/Source/Confidence structure, ask for the reformatted version
- Always expect the post-pass doc update proposal — if Cowork skips it, prompt: "§1b post-pass: what should become a source doc update?"

**Why this loop matters:**

Investigation loops turn Claude Code into a source of ground truth for strategy decisions. Without them, Cowork reasons from fuzzy memory about what the code does — and the reasoning drifts. With them, strategy decisions are grounded in observed code behaviour, and the findings compound into better source docs over time.

### Three brief types, clearly labelled

When drafting any brief for Claude Code, Cowork labels it clearly at the top:

- **INVESTIGATION** — read and report facts; no code changes
- **IMPLEMENTATION** — build a scoped feature per spec
- **DEBUG** — something's broken; validate hypothesis and fix

No brief should leave the ambiguity about what Claude Code is supposed to do.

---

## 6. Credentials without pasting into chat

When a task needs a 3rd-party API key (Apollo, SendGrid, OpenAI-compatible service):

1. You sign up / log in yourself in your regular Chrome
2. Open the service's API panel
3. Tell Cowork: "API panel for [service] is open. Provision a key per §4b."
4. Cowork (via Claude in Chrome) clicks through, generates the key, writes to `.env.local`
5. Read-back verification (first 8 chars match what you see in the panel)
6. You confirm
7. Cowork generates the handoff brief for Claude Code with instructions to read the env var

Never paste keys into chat. See `CREDENTIAL_PROVISIONING_GUIDE.md` for detail.

---

## 7. Multi-project switching

You build multiple products. Here's how to avoid cross-contamination:

### Claude Desktop (Cowork) side

- **One Claude.ai project per product.** Never mix products in one project.
- **Separate custom instructions per project.** The Cowork instructions block has product-specific context at the bottom ("LinkedIn Right is...") — each project gets its own.
- **Separate knowledge base per project.** Each project has its own CLAUDE.md, SOURCE_INDEX.md, etc. Don't share across projects.

When you switch products, close the old Claude.ai project, open the new one. Session-start refresh. Load new context. Begin.

### Claude Code side

- **One repo per product.** `cd` into the right repo before running `claude`.
- **Claude Code auto-loads CLAUDE.md from the current directory.** Different repo → different CLAUDE.md → different rules (identical universal rules, different §23 project context).
- **Don't start Claude Code in a parent directory.** Always `cd` to the specific repo first.

### Cross-project knowledge (for product families)

For products that share substance (e.g. the "Right" family sharing outreach psychology), keep a separate `shared-knowledge/` folder somewhere you control. When starting Cowork for a specific product, upload the shared-knowledge files *in addition to* the project-specific ones.

Don't duplicate the shared knowledge into each project's knowledge base — that's how drift starts.

---

## 8. Solo developer specifics — what the framework replaces

In a team, certain roles handle certain things. Solo, you handle everything. Shark provides substitutes:

| Team role | Solo substitute |
|---|---|
| Code review from another engineer | §12 Live-Test Discipline + §10 Ship-Clean |
| Tech lead signing off on decisions | ADRs (§16) — you sign off on yourself, in writing |
| Standup verbal updates | Session log entries in `CLAUDE.md` §23 |
| Pair programming / bouncing ideas | §5 Plan-Before-Build forces you to articulate before coding |
| PM prioritising the roadmap | `DEVELOPMENT_PLAN.md` + phase success criteria |
| QA doing regression testing | `TESTING.md` philosophy + per-feature test cases |
| Doc writer keeping things current | §21 Update Protocol — updates happen live, never batched |

None of these substitutes replace a team. They prevent the specific failure modes a team would normally catch. For everything else, you're still flying solo — just less blind.

---

## 9. When to break the rules

Three honest scenarios where a Shark rule should yield:

**1. Experimental / spike work.** If you're trying something speculative to see if it's even feasible, treat it as a spike — no specs, no ADRs, just a throwaway branch. If the spike succeeds and you commit to it, *then* write the ADR retroactively.

**2. Emergency fixes.** Prod is on fire. Skip the Plan-Before-Build ceremony. Fix the fire. Write the post-mortem (ADR-style) *after* the fire is out.

**3. The rule clearly isn't serving the work.** If a rule is creating friction without preventing a real failure, flag it. Either adjust CLAUDE.md to carve out an exception, or retire the rule. The framework serves the work; the work doesn't serve the framework.

When you bend a rule, note it. If you're bending the same rule repeatedly, the rule is wrong.

---

## 10. Common mistakes and how to catch them

**Mistake 1: Skipping the session-start refresh.**
Claude Desktop responds with stale context from memory instead of current source docs. Easy to miss.
Catch: every session starts with the refresh prompt. No exceptions.

**Mistake 2: Batching updates to "later."**
You tell yourself "I'll have Cowork update the spec later." You don't. The spec drifts.
Catch: updates happen when triggers fire, in the moment. If you skip one, you've created drift.

**Mistake 3: Rubber-stamping §21 proposals.**
Cowork proposes an update, you say "y" without reading. Eventually a wrong update ships.
Catch: if proposals are taking less than 30 seconds to read, either your proposals are trivial (fine) or you're not actually reading them (not fine).

**Mistake 4: Asking Cowork to code.**
"Just write this quick function for me" — suddenly Cowork is writing code, and Claude Code has no idea what happened.
Catch: if you find yourself asking for code in Claude Desktop, stop. Draft a brief, paste into Claude Code.

**Mistake 5: Letting Claude Code decide on architecture.**
"Pick whatever DB makes sense" — suddenly you have a Postgres schema with no ADR justifying why.
Catch: architectural decisions come out of Cowork discussions with ADRs, not from Claude Code's runtime judgement.

**Mistake 6: Forgetting to update SOURCE_INDEX.md.**
New ADR shipped, but the index still doesn't list it. The index is now lying.
Catch: every proposal that creates a new source doc must also propose an update to SOURCE_INDEX.md in the same turn.

---

## 11. Weekly rhythm (the one non-trigger-driven thing)

Most of Shark is trigger-driven. But a few things benefit from a weekly check-in with yourself (not Cowork):

- Scan the last week's session logs. Anything surprising? Anything blocked for more than a few days?
- Check `DEVELOPMENT_PLAN.md` → current state. Is it still accurate?
- Scan `SOURCE_INDEX.md`. Any docs you forgot to update? Any with stale dates?
- Review the Feature status table. Anything stuck in 🟡 IN PROGRESS for longer than it should be?

Takes 10 minutes. Not a formal ceremony — just a scan. Does for you what a weekly standup does for a team.

---

## 12. Quarterly rhythm (Cowork-driven)

Every 90 days, Cowork proposes a freshness pass. Don't skip this.

5 random source docs, "still accurate?" You review in 15 min, prune, confirm. `SOURCE_INDEX.md` gets the `Last reviewed` stamp updated for those docs.

This is the anti-drift mechanism. Without it, six months in, half your docs are lying. With it, drift is caught quarterly.

---

## Final note

This workflow works only if you actually use it. The biggest risk isn't that Shark is wrong — it's that it sits unused because the habit didn't form.

Two weeks of consistent use is the break-even point. After that, it feels natural and saves more time than it costs. Before that, it feels like overhead.

Push through the first two weeks on one product. If it sticks, roll it out to the rest. If it doesn't stick, honestly evaluate what broke and fix *that specific thing* rather than abandoning the whole framework.
