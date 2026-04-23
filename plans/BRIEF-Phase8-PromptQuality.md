# IMPLEMENTATION BRIEF — Phase 8: Proposal Quality Upgrade

**Type:** IMPLEMENTATION
**For:** Claude Code
**Prepared by:** Cowork (Shark framework)
**Date:** 2026-04-23
**Reference:** lib/pipeline/prompts.ts, CLAUDE.md §23

---

## Universal Debug Rule (§3)
Read `lib/pipeline/prompts.ts` fully before touching anything.
The hypothesis might be wrong. Find edge cases and existing workflow
conflicts, and address them.

## Plan-Before-Build (§5)
Before writing a single line of code, present:
1. Where you intend to modify and why
2. Your proposed plan (numbered steps)
3. Any questions or confirmations needed

---

## Problem

The final proposal quality is close but not matching the benchmark.
The root cause is **Bot 6 (Sales Psychology Bot)** — it currently
produces a general strategic brief. The Bid-Writing Bot (Bot 7) then
improvises from that brief without exact constraints, which leads to:

- "What won't go wrong" blocks that run too long
- Closing lines with weak "if helpful" framing
- No enforced idea budget (too many concepts crammed in)
- No block plan enforced on Bot 7 (it decides structure freely)
- Portfolio proof sometimes framed generically instead of with a
  specific buyer-benefit clause

The fix is to **upgrade Bot 6's output format** to a precise execution
blueprint that Bot 7 follows exactly — plus targeted refinements to
Bots 1, 4, 7, and 8.

---

## What to change — file: `lib/pipeline/prompts.ts` only

No new files. No DB changes. No route changes.
Only prompt text changes inside `BOTS` array in `prompts.ts`.

---

## Bot 1 — Persona Bot: add PMF/Fear scoring

**Change:** Extend the output to include weighted scores (1–10) for
each PMF and Fear, plus explicit fields for:
- `ambiguity_tolerance` (1–10, where 1 = needs everything spelled out,
  10 = comfortable with open-ended)
- `risk_appetite` (1–10)
- `decision_style` (primary + secondary: Safety / Predictability /
  Outcome / Speed / Status)
- `attention_bias` (what they scan for first in a proposal)

These scores are consumed by Bot 6 to calculate idea budget and block
plan. Without them, Bot 6 can't do precise arithmetic.

**Add to the end of Bot 1's user prompt:**

```
Output must include these additional scored fields at the end:

PMF SCORES (1-10): Score each primary motivational factor from the job post.
  PMF1: [factor] — [score]/10
  PMF2: [factor] — [score]/10
  (list all identified PMFs)

FEAR SCORES (1-10): Score each fear from the job post.
  Fear1: [fear] — [score]/10
  Fear2: [fear] — [score]/10
  (list all identified fears)

AMBIGUITY TOLERANCE: [score]/10 — [one-line justification]
RISK APPETITE: [score]/10 — [one-line justification]
DECISION STYLE: Primary=[style], Secondary=[style] — [one-line justification]
ATTENTION BIAS: [what they scan for first] — [evidence from the post]
```

---

## Bot 4 — Product Dev Bot: add industry story option

**Change:** The current Bot 4 only writes first-person "we built"
stories. Add a second output type: an **industry story** (a case that
is NOT our work but illustrates a relevant pattern/lesson).

The industry story is used by Bot 7 when portfolio proof is weak or
the buyer needs domain validation beyond what the portfolio provides.
Bot 6 decides whether to use portfolio OR industry story (never both
unless idea budget allows).

**Add to the end of Bot 4's user prompt:**

```
Also produce ONE industry story (2-3 sentences) that is NOT from our
portfolio:
- Describe a real-world pattern or failure mode relevant to this
  project
- Frame it as "teams working on [domain] often find..." or "a common
  challenge in [domain] is..."
- Do NOT claim this as our work
- Make the lesson directly relevant to the buyer's primary fear
- This is used ONLY if the portfolio proof is weak; Bot 6 decides

Label it clearly:
INDUSTRY STORY (not our work):
[story here]
```

---

## Bot 6 — Sales Psychology Bot: complete rewrite to execution blueprint

This is the main change. Bot 6 must output a **machine-readable
execution blueprint** that Bot 7 follows as strict instructions —
not general advice.

Replace the entire `buildUserPrompt` for `salespsych` with the
following. Keep the system prompt (`SALESPSYCH_SYSTEM`) as-is.

**New Bot 6 user prompt:**

```
Here is the Upwork job posting:

${state.jobInput}

Here is the buyer persona analysis with scores:

${req(state.outputPersona, "persona analysis")}

Here is the technical analysis:

${req(state.outputTechnical, "technical analysis")}

Here are the selected portfolio items:

${req(state.outputPortfolio, "portfolio selection")}

Here is the micro-methodology:

${req(state.outputMicro, "micro-methodology")}

Here are the product development stories and industry story:

${req(state.outputProductDev, "product development stories")}

Produce a precise execution blueprint for the Bid-Writing Bot.
Output as structured fields. Each field is a direct instruction.

FIELD 0 — OPENING HOOK
Write 3 candidate opening hooks (one sentence each). Each must:
- Start with the buyer's #1 fear or consequence, not with "I" or "we"
- Be completable in ~12 words (Upwork preview limit)
- Create a knowledge gap (hint at a solution without giving it)
Then write: SELECTED HOOK: [which one and why in one line]

FIELD 1 — EMOTIONAL TONE
Desired feel: [2-3 words]
Avoid: [2-3 specific things to avoid]
Reason: [one line tied to persona scores]

FIELD 2 — REFLECTION RULES
How to open the proposal body (after greeting + hook):
- Mirror these exact buyer phrases: [list 3-5 phrases from the job post verbatim]
- First sentence must be about THEM not us
- Forbidden: meta-compliments about the brief ("great project", "interesting challenge")
- Reflection length: [compact 2-4 lines / medium 1 paragraph / skip]

FIELD 2B — CONTENT ORDERING
Front-load (put early): [ordered bullet list]
Delay (put later or omit): [bullet list]
Hard avoid (never include): [bullet list]
Line-selling rule: [one sentence — what each line must do to earn the next]

FIELD 3 — QUESTION STRATEGY
Number of questions: [1 or 2]
For each question:
  - Internal topic: [the real technical/business question]
  - Buyer-facing phrasing: [exact question text to use]
  - Why it matters to buyer: [one line]
Tone: [soft / direct / outcome-protecting]

FIELD 4 — MICRO-METHOD DEPLOYMENT
Include micro-method: [Yes / No / Condensed to one line]
If yes: emotional job it must do: [one line]
Where in proposal: [early / middle / before questions]

FIELD 5 — PROOF STRATEGY
Primary proof: [portfolio item name + URL if available]
Buyer-benefit clause: [exact 1-sentence frame: "This shows X which means Y for your project"]
Industry story: [include / suppress]
If include: [which story and where]
Coexistence rule: [can portfolio + story both appear? yes/no — why]

FIELD 6 — CLOSING LINE
Write the exact closing line(s) for the proposal.
Requirements:
- Warm but direct — not "if helpful" or "feel free"
- References the questions asked
- Has a clear next step
- Max 2 sentences

FIELD 7 — IDEA BUDGET
Calculation:
  Top PMF score: [score] → base blocks: [N]
  Ambiguity tolerance: [score] → cap: [N]
  Top Fear score: [score] → adjustment: [+0 / cap further]
  MAX IDEA BLOCKS: [final number — never exceed 5]

FIELD 8 — HARD RED LINES FOR BOT 7
List 6-10 absolute prohibitions for the Bid-Writing Bot.
Each must be specific and actionable (not generic like "be concise").
Examples of the right level of specificity:
- "Do not include a step-by-step phase plan — reads as task-only delivery to this buyer"
- "Do not open with 'I' — Upwork preview will show it; hook must lead"
- "Do not use 'if helpful' or 'feel free' — weak framing for this buyer type"

FIELD 9 — BLOCK PLAN
Allocate the MAX IDEA BLOCKS from Field 7 across the proposal:
Block 1: [what it must contain]
Block 2: [what it must contain]
Block 3: [what it must contain — if budget allows]
(etc.)

Suppression order if crowded (which blocks to cut first):
1. [first to cut]
2. [second to cut]
Never cut: [what must always stay]

FIELD 10 — LENGTH AND FORMAT
Target word count: [number range]
Paragraph structure: [how many paragraphs, rough purpose of each]
Line breaks: [where to use them — Upwork plain text]
Forbidden formatting: [markdown headers / bullet points / bold]
```

---

## Bot 7 — Bid-Writing Bot: follow the blueprint precisely

**Change:** Rewrite the user prompt to explicitly reference each Field
from Bot 6's execution blueprint as a direct instruction.

Replace the entire `buildUserPrompt` for `bidwriter`:

```
Here is the Upwork job posting:
${state.jobInput}

Here is the buyer persona:
${req(state.outputPersona, "persona analysis")}

Here is the technical analysis:
${req(state.outputTechnical, "technical analysis")}

Here are the selected portfolio items:
${req(state.outputPortfolio, "portfolio selection")}

Here are the product development stories:
${req(state.outputProductDev, "product development stories")}

Here is the micro-methodology:
${req(state.outputMicro, "micro-methodology")}

Here is the sales psychology execution blueprint:
${req(state.outputSalesPsych, "sales psychology blueprint")}

Write the complete Upwork proposal. Follow the execution blueprint
field by field — it is your strict specification, not a suggestion.

MANDATORY RULES:
1. Line 1 is the greeting (Hi / Hi [name] / Hi [company] team)
2. Line 2 embeds FIELD 0 SELECTED HOOK — exactly as written or
   lightly adapted. Do not bury it.
3. Follow FIELD 2 REFLECTION RULES — mirror buyer phrases exactly,
   first sentence about them, no meta-compliments
4. Follow FIELD 2B CONTENT ORDERING — front-load what it says,
   delay what it says, never include what it prohibits
5. Include FIELD 5 PRIMARY PROOF with the exact buyer-benefit clause
   from the blueprint
6. Include / suppress industry story per FIELD 5 coexistence rule
7. Ask FIELD 3 QUESTIONS — use the buyer-facing phrasing exactly
8. End with FIELD 6 CLOSING LINE — use it verbatim or lightly adapted.
   Never use "if helpful", "feel free", or passive CTAs.
9. Stay within FIELD 7 MAX IDEA BLOCKS — do not exceed it
10. Obey every item in FIELD 8 HARD RED LINES — no exceptions
11. Follow FIELD 9 BLOCK PLAN — allocate content exactly as specified
12. Hit FIELD 10 TARGET WORD COUNT — cut or expand accordingly
13. Write in first person as a senior HestaBit team member
14. No bullet points in the proposal body — natural paragraphs only
15. Plain text only — no markdown, no headers, no bold

Output ONLY the final proposal. No preamble, no labels, no explanation.
```

---

## Bot 8 — Content Formatting Bot: add specific polish rules

**Change:** The current Bot 8 prompt is good but generic. Add these
specific rules to the existing prompt:

Add after the existing rule 5 ("Human Voice"):

```
5b. CLOSING LINE CHECK: The last 1-2 sentences must be direct and
    warm. If you see "if helpful", "feel free to", "don't hesitate",
    or "I'd be happy to" — rewrite the closing to be active and
    specific. The closing should name the next step, not offer one
    passively.

5c. WHAT-WON'T-GO-WRONG AUDIT: If the proposal has a paragraph
    explaining what will not go wrong or what risks are covered,
    it must be no longer than 3 sentences. Cut anything beyond 3
    sentences from that block ruthlessly. Quality over quantity.

5d. IDEA DENSITY CHECK: If more than 4 distinct concepts appear in
    the proposal, identify the weakest one and cut it entirely.
    A sharper, shorter proposal wins over a comprehensive one.

5e. PROOF CLAUSE CHECK: If a portfolio link appears, it must be
    followed immediately by a one-sentence buyer-benefit clause
    explaining specifically why that project is relevant. If the
    clause is missing or generic ("this shows our experience"),
    rewrite it to name the specific capability it proves.
```

---

## What this does NOT change

- No changes to Bot 2 (Technical), Bot 3 (Portfolio Facts), or
  Bot 5 (Micro-Methodology) — these are working well
- No changes to any route, DB, or UI code
- No new files — only `lib/pipeline/prompts.ts`

---

## Success criteria

Run the pipeline against all 4 reference job posts and compare:

1. Bot 6 output contains all 10 Fields (0-9) with specific,
   non-generic content in each
2. Bot 7 proposal opens with greeting on line 1, hook on line 2
3. Bot 7 proposal does not exceed FIELD 7 max idea blocks
4. Bot 7 proposal closing does not use "if helpful" or "feel free"
5. Bot 8 output: any "what won't go wrong" block is ≤ 3 sentences
6. Bot 8 output: every portfolio link has a specific buyer-benefit
   clause immediately after it
7. Final proposals match or exceed the quality of the reference
   "Content Formatting Bot" outputs provided in source-materials
8. `npx tsc --noEmit` exits 0
9. `npx next lint` exits clean
