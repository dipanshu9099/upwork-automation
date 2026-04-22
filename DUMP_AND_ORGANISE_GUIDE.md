# DUMP_AND_ORGANISE_GUIDE.md

**Purpose:** This guide is primarily for **Cowork** — it describes the onboarding flow Cowork executes automatically when a founder opens a fresh Shark project. A shorter founder-facing summary appears at the end.

This is the operational detail for §1c New Project Onboarding Protocol in CLAUDE.md.

---

## For Cowork — how to run the onboarding flow

### Step 1: Detect that onboarding is needed

At session start, after reading SOURCE_INDEX.md per §20 Source Discipline:

- Check the status of `product/VISION.md`, `architecture/STACK.md`, `DEVELOPMENT_PLAN.md`
- If ALL THREE are 🔴 pending or missing → trigger §1c onboarding
- If ANY are populated → do NOT trigger; proceed normally with the established project

### Step 2: Send the opening message

Send this exactly (adjust only the greeting if natural):

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

Wait for founder's response. Do nothing else.

### Step 3a: If founder uploads materials

Read every file in `source-materials/`. Then respond with an inventory and contradiction-surfacing summary in this shape:

```
Found [N] files in source-materials/. Here's what I see:

**Categorisation (my best guess):**
- Vision / positioning material: [list files]
- Architecture / technical notes: [list files]
- Feature specs or fragments: [list files]
- Competitor / market research: [list files]
- Ambiguous / unclear: [list files]
- Duplicates or outdated: [list files]

**Contradictions I found:**

1. [File A], dated [X], says [position 1].
   [File B], dated [Y], says [position 2].
   Which is current?

2. [Similar format for each contradiction]

**Gaps I notice (topics not covered by any file):**
- [e.g. "No explicit statement of what the product is NOT"]
- [e.g. "No data model or schema description"]
- [e.g. "No target user persona"]

**Questions to resolve before I can draft source docs:**

Let's work through these one at a time. First question:

[Single question here]
```

Wait for founder's answer. Then ask the next question. One at a time.

### Step 3b: If founder has no materials

Acknowledge and begin the verbal briefing:

```
Okay — we'll build the source docs from scratch through conversation.

First question, then I'll wait for your answer before the next:

What are you building, in one sentence? Plain language. No jargon.
```

Wait for the answer. Then move to the next question in the standard briefing sequence.

### Step 4: The standard briefing sequence

Work through these topics, one question at a time. Adapt phrasing to conversation flow, but cover all topics before moving to drafting.

| # | Topic | What you're trying to extract |
|---|---|---|
| 1 | What the product does | One-sentence, plain-language description |
| 2 | Target buyer | Specific role, company size, industry |
| 3 | Success criteria | Concrete measure — revenue, users, behaviour |
| 4 | **What the product is NOT** | **Explicit scope exclusions — non-negotiable question** |
| 5 | Why now | What's changed in the market or technology |
| 6 | Stack hypotheses | Tech choices leaning toward + ones still open |
| 7 | Major decisions ahead | 3-5 big ones that will need ADRs |
| 8 | Phase hypothesis | Rough build phases (base setup, core loop, etc.) |

**Rules during briefing:**

- One question at a time. Never batch.
- Wait for the full answer before asking the next.
- If an answer is vague, ask a follow-up before moving on. Don't let "we'll figure it out" stand for a topic as critical as target buyer.
- If the founder contradicts an earlier answer, flag the contradiction and ask them to resolve it.
- If the founder says "skip onboarding" or "I'll do the source docs myself," invoke the override clause (§1c).

### Step 5: Gate — confirm briefing is complete

When you've covered all eight topics and the answers are specific enough to draft source docs, send:

```
Onboarding briefing complete. I have enough context to draft:

- VISION.md — I'll synthesise answers to Q1-Q5 into a 500-word vision
- STACK.md — I'll capture Q6 with reasoning for each choice
- DEVELOPMENT_PLAN.md — I'll structure Q8 into sequential phases
- ADR-001 through ADR-[N] — one per major decision from Q7 that's 
  already been made or is close to made

Do you want me to begin drafting now, or continue in a separate session?

My recommendation: fresh session. Drafting is a different kind of work 
than briefing, and you've been answering questions for a while. Come 
back refreshed and I'll draft each doc for your approval.
```

**Do not draft source docs before the founder confirms.** This is a gate per §0 Human-in-the-Loop.

### Step 6: Drafting (when the founder returns for the drafting session)

Draft in strict order, one at a time:

1. `product/VISION.md` (500 words, §22 cap)
2. `architecture/STACK.md` (500 words)
3. `DEVELOPMENT_PLAN.md` (2 pages max)
4. `plans/DP-01-[phase-name].md` (first phase only — don't plan all phases yet)
5. `decisions/ADR-001` through ADR-[N] — one per major decision
6. `SOURCE_INDEX.md` update — populate with everything just created

Each draft uses the §21 Update Protocol shape (File / Type / Reason / Adding / Removing / Net / Diff). Founder approves each before you move to the next.

### Step 7: Post-drafting handoff

Once source docs are approved and committed:

- Update SOURCE_INDEX.md to reflect new status
- Log the onboarding session in CLAUDE.md §23 Session History
- Tell the founder: "Onboarding complete. Next session, we can start Phase 1 development per DP-01. I'll draft the first implementation brief for Claude Code when you're ready."

Onboarding is done. Normal Shark workflow begins.

---

## The override clause — experienced founders

If at any point the founder says "skip onboarding," "I'll populate the source docs myself," or similar:

1. Acknowledge the request
2. Confirm once, per §0: *"Understood — you'll populate VISION, STACK, DEVELOPMENT_PLAN yourself. I'll review and propose refinements per §21 when you share drafts. Shall I stand by, or help with something else meanwhile?"*
3. If they confirm, respect the decision
4. Do not re-propose onboarding unless they ask

This is the escape hatch for founders who already have clear documentation and don't need briefing.

---

## For the Founder — the short version

You don't need to know any of the above. Here's what you do:

1. **Set up the Cowork project** — create the project in Claude Desktop, point it at your product folder, paste the Cowork instructions (provided separately)
2. **Start a task in the project** — just send "hi" or any message
3. **Cowork will take over** — it'll prompt you for existing materials or start briefing
4. **Answer its questions one at a time** — no need to batch, no need to over-prepare
5. **When Cowork says briefing is complete, take a break** — come back for the drafting session later
6. **Review each draft Cowork proposes** — approve or edit
7. **You're ready to build** — the framework is set up, source docs are populated, development begins

Total time across all sessions: 2-4 hours depending on how much material you start with. Spread across 2-3 sittings is ideal.

Do NOT try to pre-populate VISION.md or STACK.md yourself before running onboarding. The one-question-at-a-time briefing is how Cowork captures your thinking accurately. Pre-populating loses that signal.
