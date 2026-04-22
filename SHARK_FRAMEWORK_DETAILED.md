# Shark Framework — Detailed Explainer

**Version:** 1.3
**Purpose:** A single document that explains everything about the Shark framework — what it is, why it exists, how it works, and how to use it. Shareable with any person or AI agent who needs to understand the system.

**Read time:** 10 minutes.

---

## 1. What is Shark?

**Shark is an operating system for building software products with AI collaboration.**

It structures how a solo developer (or small team) works with two Anthropic tools — **Claude Cowork** (in Claude Desktop / Claude.ai) and **Claude Code** (in terminal / VS Code) — so that products built this way don't drift, don't bloat, and don't re-litigate the same decisions every few weeks.

Shark is not a software library, not a product, and not a methodology like Agile. It's a **set of rules, templates, and workflows** that live in every project's repository and govern how humans and AI agents collaborate on that project.

The framework is named "Shark" — short, memorable, no acronym.

---

## 2. Why does Shark exist?

AI-assisted development has three recurring failure modes that Shark specifically addresses:

**Failure mode 1: AI tools forget.**
Claude Cowork and Claude Code have no persistent memory across sessions. Every new conversation starts fresh. Without structure, developers re-explain the product every time, or the AI tools drift further from reality with each session until their outputs become unreliable.

**Failure mode 2: Decisions get re-litigated.**
Without a record of *why* you chose Postgres over MongoDB in week 2, Cowork will cheerfully suggest MongoDB as a fresh idea in week 8. You either accept and regret it, or argue the same argument again.

**Failure mode 3: Documents bloat until nobody reads them.**
Left alone, a project's vision document grows from 1 page to 40 pages over six months. Every session adds; nothing gets removed. Eventually the document is longer than anyone reads, so nobody reads it, and the document becomes ceremonial rather than useful.

Shark provides specific structural answers to each.

---

## 3. The two philosophies Shark is built on

Everything in Shark — every rule, every template, every workflow — serves one of two foundational principles.

### Philosophy 1: Human-in-the-Loop (§0)

**Every meaningful output from an AI tool passes through a human review gate before it becomes authoritative.** The human (owner) is never out of the loop. AI accelerates the work; judgment remains human.

There are four explicit review gates:

- **Spec gate** — reviewing a new feature spec, ADR, or prompt version before it's accepted
- **Plan gate** — reviewing Claude Code's implementation plan before it writes code
- **Update gate** — reviewing a proposed change to any source-of-truth document
- **Ship gate** — reviewing shipped code against the live-test checklist before marking it done

Silent edits to any authoritative document are forbidden. Batching reviews to "end of day" is forbidden. Reviews happen when commitment triggers fire, in real time.

### Philosophy 2: Source of Truth (§20)

**Cowork and Claude Code answer questions about product, architecture, and past decisions by reading source documents — not by reasoning from memory.** If no document covers the question, they say so explicitly and propose writing one.

The source-of-truth documents are versioned at the project root in a defined folder structure. At the start of every session, both AI tools read a one-page index (`SOURCE_INDEX.md`) that tells them which documents exist, their current status, and when they were last reviewed. This index is the canonical starting point for every conversation.

These two philosophies are load-bearing. Every other rule and structure in Shark mechanises one or both of them.

---

## 4. How Shark structures work

Shark sits at the intersection of three actors:

1. **The human owner** — you, the developer or founder
2. **Claude Cowork** — runs in Claude Desktop or Claude.ai, handles strategy, specs, briefs, documentation, decisions
3. **Claude Code** — runs in terminal or VS Code, handles implementation: reading, writing, running, testing code

The golden rule is strict: **Cowork thinks. Claude Code codes. The two never mix roles.** If Cowork starts writing code, the owner stops it. If Claude Code starts making architectural decisions, the owner stops it.

### The three brief types

When Cowork hands work to Claude Code, it writes a brief. There are exactly three brief types — each with its own shape, purpose, and review gate:

**Investigation brief (§1b):** Cowork needs factual information about the code to answer a strategy question. Claude Code reads specified files, reports findings in a structured format (question, answer, source, confidence), and makes NO changes to the code. This is the bidirectional loop where Cowork uses Claude Code as a research instrument. Investigations never silently become implementations.

**Implementation brief (§1):** Cowork has an approved feature spec; Claude Code builds it. The brief includes symptom, expected behavior, a flagged hypothesis, and instructions to follow the Universal Debug Rule (§3) and Plan-Before-Build (§5) before writing any code.

**Debug brief (§3):** Something is broken; Cowork has a hypothesis about why. Claude Code reads the actual code first, validates or rejects the hypothesis, then fixes the real root cause — not what the brief guessed. Claude Code reports back with what the actual root cause was.

Every brief is labeled at the top: INVESTIGATION, IMPLEMENTATION, or DEBUG. No ambiguity.

### The trigger-driven update rhythm

Updates to source-of-truth documents happen in real time when one of three commitment triggers fires during conversation:

1. **Language of decision** — "let's do X," "we'll go with Y," "that's settled"
2. **Explicit scoping** — "feature X will do A, B, and C"
3. **Resolved contradiction** — a conflict with an existing doc is resolved

When a trigger fires, Cowork proposes an update in a strict fixed shape (File, Type, Reason, Adding, Removing, Net size change, Diff). The human reviews in 30 seconds and approves, edits, or rejects. Work continues.

This is different from "end of day" or "end of session" batching, which creates memory loss about decision context and allows drift.

### The bloat discipline

Every document type has a hard size cap: VISION.md at 500 words, STACK.md at 500 words, feature specs at 2 pages, ADRs at 1 page, etc. Every modification must show what's being removed alongside what's being added — "kill more than you create" is the default posture. When a document hits its cap, Cowork proposes consolidation instead of pure addition.

Automatic pruning is triggered by events: an ADR marked retired triggers a proposal to remove its references from other docs. A feature spec that has been DONE for 30+ days triggers a proposal to compress it into a one-paragraph summary. Every 90 days, Cowork proposes a "freshness pass" on 5 random documents.

---

## 5. The file structure

Every Shark project has this structure at its root:

```
<project-repo>/
├── CLAUDE.md                          ← rulebook (§0–§23)
├── SOURCE_INDEX.md                    ← 1-page live index
├── TESTING.md                         ← testing philosophy
├── DEVELOPMENT_PLAN.md                ← high-level phased roadmap
├── SHARK_FRAMEWORK.md                 ← framework overview
├── SOLO_DEVELOPER_WORKFLOW.md         ← daily workflow
├── NEW_PROJECT_CHECKLIST.md           ← 15-min setup ritual
├── CREDENTIAL_PROVISIONING_GUIDE.md   ← credential automation
├── DUMP_AND_ORGANISE_GUIDE.md         ← onboarding for new projects
│
├── product/
│   ├── VISION.md                      ← what + who + why (500w cap)
│   └── FEATURES/                      ← one spec per feature
│
├── plans/                             ← one detailed plan per phase
│
├── architecture/
│   ├── STACK.md                       ← tech choices + reasoning
│   ├── SYSTEM.md                      ← component map
│   └── DATA.md                        ← data model + meaning
│
├── prompts/                           ← LLM prompts, versioned in-file
├── decisions/                         ← ADRs, one per decision
├── source-materials/                  ← original scattered uploads
└── snapshots/                         ← milestone freezes (rare)
```

The key insight: the structure is **universal** (same for every product), but the **content** is project-specific. LinkedIn Right's VISION.md is different from PitchRight's VISION.md, but both products use identical structure.

---

## 6. The rules (CLAUDE.md §0–§23)

The rulebook contains 24 numbered sections. The most load-bearing:

| Section | Rule | Why it matters |
|---|---|---|
| §0 | Human-in-the-Loop | Every output passes through human review |
| §1 | Role Clarity + Briefing Rules | Cowork writes briefs, Claude Code implements |
| §1b | Investigation Loops | Three brief types, strict separation |
| §1c | New Project Onboarding Protocol | Cowork drives onboarding automatically on new projects |
| §3 | Universal Debug Rule | Read actual code before fixing |
| §4 | Access Request Rule | Ask before guessing on missing access |
| §4b | Automated Credential Provisioning | Claude in Chrome handles dev credentials |
| §5 | Plan-Before-Build | Claude Code plans and asks before coding |
| §6 | Fail-Open Rule | Background work never blocks main flow |
| §9 | Data-Layer Merge Rule | Never overwrite accumulating data |
| §10 | Ship-Clean Rule | Typecheck + lint clean before commit |
| §12 | Live-Test Discipline | "Done" means tested in production |
| §14 | Spec-Before-Implementation | Specs approved before code is written |
| §17 | Status Discipline | Only five exact statuses allowed |
| §19 | Known Failure Modes | 19 recurring failure patterns with prevention |
| §20 | Source Discipline | Answer from documents, not memory |
| §21 | Update Protocol | No silent edits, fixed-shape proposals |
| §22 | Bloat Discipline | Size caps, kill-more-than-create |

The full text of each rule lives in `CLAUDE.md`. The rulebook is itself treated as a living document — adjusted when real-world use reveals what's actually needed.

---

## 7. Development Plans — strategic roadmapping

Shark distinguishes between features (what the product does) and phases (the strategic chunks of the build journey).

`DEVELOPMENT_PLAN.md` lives at the project root, capped at 2 pages. It lists the phases in sequential order with rough durations, dependencies, and current status. Phases are not feature bundles — they are build epochs with distinct character. Examples: "Base Setup," "Core Loop," "Relationship Building," "Automation Layer."

Each phase has its own detailed plan in `plans/DP-NN-<phase-name>.md`, capped at 3 pages. The detailed plan describes workstreams within the phase, features that map to it, expected decisions that will trigger ADRs, success criteria (verifiable, not vague), known risks with mitigations, and honest timeline estimates.

This two-layer structure means anyone can see the overall roadmap (2-page high-level) or drill into a specific phase (3-page detailed), without the roadmap bloating into a tome.

---

## 8. Source-of-truth discipline in practice

At the start of every session, Cowork and Claude Code read `SOURCE_INDEX.md` first. The index lists every document, its status (stable, in progress, pending, blocked, retired), when it was last updated, and when it needs its next freshness review.

When asked a question about product, architecture, or past decisions, Cowork must cite the specific source document the answer came from. If no document covers it, Cowork states this explicitly and proposes either (a) writing a new document, (b) opening an investigation loop to get the ground truth from code, or (c) asking the owner.

Cowork never fabricates confident answers from memory. The source documents are authoritative; everything else is conversation.

---

## 9. Versioning — a three-tier approach

Shark takes a deliberate position on what to version and how.

**Tier A: ADRs version by supersession.** Once an Architecture Decision Record is accepted, it is never edited. When the decision changes, a new ADR supersedes it; the old one is marked RETIRED with a pointer to the new one. Both stay in `decisions/` forever. This gives true decision history — the original reasoning is preserved.

**Tier B: Prompts version in-file.** Each prompt file contains up to two active versions (current + previous) with changelogs and eval results, stacked top-to-bottom. Older versions move to an archive section. Prompt regressions are silent and specific wording matters, so visible version history is essential.

**Tier C: Everything else uses milestone snapshots.** VISION, STACK, SYSTEM, DATA, feature specs — these get edited in place. No per-edit version files. At real milestones (pre-pivot, pre-rewrite, pre-funding, pre-handoff), Cowork proposes snapshotting all live docs into `snapshots/YYYY-MM-DD-<label>/`. Maybe 2-4 snapshots per year. Git commit history covers ordinary edit tracking.

This tiered approach keeps the `why` of decisions, catches silent prompt regression, and avoids the file bloat of per-edit versioning for content that Git already tracks.

---

## 10. Automated credential provisioning (§4b)

For dev/test environments, Shark codifies a specific credential-handling flow using Claude in Chrome (Anthropic's browser extension).

The split is clean:
- **Owner handles:** signup, payment, email verification, login, 2FA, opening the API panel in Chrome
- **Cowork (via Claude in Chrome) handles:** clicking "Generate key," naming the key, copying the value, writing it to `.env.local`
- **Claude Code handles:** reading from `.env.local` at build/test time
- **Never handled by any AI tool:** passwords, 2FA codes, raw secret values in chat

Every provisioning run ends with a mandatory read-back verification (first 8 characters of the generated key must match what the owner sees in the panel). After verification, Cowork generates a ready-to-paste brief for Claude Code to wire up the new integration.

This eliminates the friction of "Cowork asks for API key, owner pastes into chat" while never putting credentials in AI tool memory.

---

## 11. What Shark is designed for (and not)

**Good fit:**
- Solo founder or small team building multiple products
- Each product needs to stay coherent across weeks or months
- Work is high-value enough that drift, re-litigation, and doc bloat are real costs
- Owner is willing to invest 30 seconds per update review in exchange for long-term coherence

**Not a good fit:**
- Large enterprise teams with dedicated PMs and doc writers (they already solve these problems structurally)
- One-off prototypes that won't live past the weekend
- Projects where specs are genuinely trivial
- Owners who want to rubber-stamp AI output without review (the framework collapses silently)

---

## 12. Adoption — what using Shark actually requires

1. **Copy the framework into the project repo.** Shark ships as a downloadable ZIP with ~15 markdown files and a defined folder structure. Unzip at project root.

2. **Fill in project-specific context.** Open `CLAUDE.md`, go to §23 (the project-specific block), fill in: project name, owner, stack, repo URL, lint baseline. Everything above §23 is universal and stays unchanged.

3. **Upload the core files to Claude.ai project knowledge.** Specifically `CLAUDE.md`, `SOURCE_INDEX.md`, `SHARK_FRAMEWORK.md`, and the Cowork custom instructions block.

4. **Run the dump-and-organise flow.** Upload whatever scattered project notes exist into `source-materials/`, then use the documented process in `DUMP_AND_ORGANISE_GUIDE.md` to have Cowork inventory the materials, surface contradictions, and draft the initial source-of-truth documents (VISION, STACK, initial ADRs).

5. **Provision credentials via §4b flow.** For each dev/test service the project needs, open the service's API panel in Chrome, let Cowork generate the key and write to `.env.local`.

6. **Work the trigger-driven rhythm.** Every session starts with Cowork reading SOURCE_INDEX.md. Commitment triggers during conversation produce proposals. Every brief to Claude Code is labeled with its type (INVESTIGATION / IMPLEMENTATION / DEBUG). Updates happen live, not batched.

7. **Calibration period.** First 2-4 weeks include explicit "why I'm proposing this" notes on every update, so the owner can correct miscalibration. After ~10 corrections, Cowork's judgment matches the owner's taste.

---

## 13. The framework's honest limitations

Shark is not magic. Three limitations worth knowing upfront:

**Calibration takes real time.** The first two weeks feel slightly wrong. Cowork over-proposes or misses triggers. The owner has to actively correct. By week 3-4, it's smooth.

**The framework depends on owner discipline.** If the owner rubber-stamps every proposal without reading, the source documents drift and the framework silently fails. The 30-second review is the whole system — bypassing it defeats the point.

**Cross-session memory is still imperfect.** Cowork's attention to the rules can drift over a long session. The fix is a short refresh prompt at session start ("re-read §20-§22 and SOURCE_INDEX.md, confirm loaded"). Without this discipline, rules quietly get ignored after hour two.

None of these are fatal. All require the owner to stay active. Shark is a system for an engaged human, not an autopilot.

---

## 14. What makes Shark different from alternatives

**vs. having no framework:** The baseline. Chaotic documentation, decisions re-litigated, documents that bloat until unread. Shark's whole purpose is to replace this.

**vs. enterprise methodologies (RUP, SAFe, etc.):** Those are designed for large teams with formal roles. Shark is designed for one to three people. Overhead is minimal; structure is minimal.

**vs. "just use GitHub issues + a README":** This works until the project grows past one developer or past a few months. Shark scales to products that take 6+ months of solo work without losing coherence.

**vs. AI-first frameworks like Cursor Rules or Aider conventions:** Those focus on the coding layer. Shark covers strategy, specs, decisions, prompts, and infrastructure — the whole product development journey, not just the code editor.

---

## 15. Versioning of Shark itself

Shark is itself a living framework. The current version is **1.2**. Changes happen when real-world use reveals gaps:

- **v1.0** — Initial framework (CLAUDE.md + templates + guides)
- **v1.1** — Added Investigation Loops (§1b), Human-in-the-Loop (§0), Development Plans
- **v1.2** — Added comprehensive explainer documents
- **v1.3** — Added New Project Onboarding Protocol (§1c); Cowork now drives onboarding automatically on empty projects
- **v1.2** — Added comprehensive explainer documents for sharing

Each version is released as a complete ZIP. Projects using older versions can upgrade by diffing their CLAUDE.md against the new one, taking what applies, and running one freshness pass.

---

## 16. Using this document

If you are a **person** reading this to understand Shark:
- You now know what it is, why it exists, and how it works
- To adopt it, download the latest ZIP and follow the adoption steps above
- For day-to-day workflow, read `SOLO_DEVELOPER_WORKFLOW.md`
- For the full rulebook, read `CLAUDE.md`

If you are an **AI agent** reading this as context:
- The framework expects you to follow CLAUDE.md rules strictly
- If you are operating as Cowork, your job is strategy and documentation, never code
- If you are operating as Claude Code, your job is implementation, never architectural decisions
- At session start, read SOURCE_INDEX.md first
- Every brief you receive is labeled INVESTIGATION, IMPLEMENTATION, or DEBUG — behave accordingly
- Every source-doc update you propose uses the fixed shape from §21
- Every commitment trigger fires a proposal; nothing is silent

---

## 17. Philosophy, in one sentence

**Shark's core claim:** AI accelerates work, but coherent products require human judgment applied consistently over time — and that consistency comes from structured source-of-truth discipline, not from trusting AI memory.

Everything else in the framework is mechanism in service of that claim.

---

**Framework maintainer:** Dipanshu
**Current version:** 1.2
**Full framework repository:** [add your URL]
**Last updated:** 2026-04-20
