# SHARK_FRAMEWORK.md

**Purpose:** One document to explain the Shark framework — the operating system for building products with Claude Cowork and Claude Code. Hand this to any collaborator or future-you; they'll understand the whole system in one read.

**Read time:** 10 minutes.

---

## 1. What is Shark?

**Shark is a framework for building software products with two AI tools as collaborators:**

- **Claude Cowork** — the strategist. Writes specs, briefs, documentation, plans. Never writes code.
- **Claude Code** — the implementer. Reads, writes, and runs code. Works from briefs Cowork hands over.

Shark adds structure around these two tools so products built this way don't drift, don't bloat, and don't re-litigate decisions.

### The two philosophies Shark is built on

**1. Human-in-the-Loop (§0)** — Every meaningful output passes through a human review gate before it becomes authoritative. The human is never out of the loop. AI accelerates; judgment remains human.

**2. Source of Truth (§20)** — Questions about product, architecture, and decisions get answered from source documents, not from memory. The documents are the authoritative state; everything else is conversation.

These two principles are load-bearing. Every rule, template, and workflow in Shark serves one or the other.

---

## 2. What Shark is built for

**Good fit:**
- Solo founder or small team building multiple products
- Each product needs to stay coherent across weeks or months
- You're tired of re-litigating decisions, losing context between sessions, and explaining the product three times to the same AI tool

**Not a good fit:**
- Large enterprise teams with dedicated doc writers and PMs (you already have this)
- One-off prototypes that won't live past the weekend
- Projects where the spec is genuinely trivial and doesn't benefit from structure

---

## 3. The three problems Shark solves

### Problem 1: AI tools forget

Cowork and Claude Code have no persistent memory across sessions. Without structure, you re-explain the product every time, or the tools drift further from reality each session.

**Shark solution:** source-of-truth documents both tools read at session start.

### Problem 2: Decisions get re-litigated

Without a record of *why* you chose Postgres over MongoDB, Cowork will suggest MongoDB as a fresh idea six weeks later.

**Shark solution:** ADRs (Architecture Decision Records) — one-page documents capturing each decision with its reasoning and rejected alternatives. Never edited, only superseded.

### Problem 3: Documents bloat until nobody reads them

Left alone, a VISION.md grows from 1 page to 40 pages over six months. Every session adds; nothing gets removed. Eventually it becomes ceremonial rather than useful.

**Shark solution:** hard size caps per document type, plus a "kill more than you create" rule enforced on every update.

---

## 4. The file structure

```
<project-repo>/
├── CLAUDE.md                          ← universal rules (§0–§22) + project context (§23)
├── SOURCE_INDEX.md                    ← 1-page live index of all source docs
├── TESTING.md                         ← testing philosophy
├── DEVELOPMENT_PLAN.md                ← high-level phased roadmap
├── SHARK_FRAMEWORK.md                 ← this file (explainer)
├── NEW_PROJECT_CHECKLIST.md           ← 15-min setup ritual
├── CREDENTIAL_PROVISIONING_GUIDE.md   ← how to provision dev credentials
├── DUMP_AND_ORGANISE_GUIDE.md         ← how to start a new project
├── SOLO_DEVELOPER_WORKFLOW.md         ← daily workflow for a solo builder
│
├── product/
│   ├── VISION.md                      ← what + who + why (500 words)
│   └── FEATURES/
│       ├── D1-<first-feature>.md      ← one file per feature
│       └── D2-<second-feature>.md
│
├── plans/
│   ├── DP-01-<phase-name>.md          ← detailed plan for each phase
│   └── DP-02-<phase-name>.md
│
├── architecture/
│   ├── STACK.md                       ← tech choices + reasoning
│   ├── SYSTEM.md                      ← component map
│   └── DATA.md                        ← data model + semantic meaning
│
├── prompts/
│   └── <prompt-name>.md               ← one file per prompt, versioned in-file
│
├── decisions/
│   └── ADR-001-<title>.md             ← one file per major decision
│
├── source-materials/                  ← original scattered uploads (archive)
│
└── snapshots/                         ← milestone snapshots only (rare)
```

---

## 5. The documents, explained

### Strategic layer (what + why + how-built)

| Doc | Purpose | Cap | Notes |
|---|---|---|---|
| `product/VISION.md` | What the product is, who it's for | 500 words | Consulted when deciding if a feature fits |
| `DEVELOPMENT_PLAN.md` | High-level phased roadmap | 2 pages | Sequential phases, not feature bundles |
| `plans/DP-NN-*.md` | Detail for each phase | 3 pages each | Workstreams, success criteria, risks |
| `product/FEATURES/D*.md` | One feature spec per file | 2 pages each | Maps to a DP phase |

### Engineering layer (how-built + decisions)

| Doc | Purpose | Cap | Notes |
|---|---|---|---|
| `architecture/STACK.md` | Tech choices + reasoning | 500 words | "What's NOT in the stack" is as important as what is |
| `architecture/SYSTEM.md` | Component map | 3 pages | Split into COMPONENTS/ if larger |
| `architecture/DATA.md` | Data model + meaning | 3 pages | Semantic meaning, not just schema |
| `prompts/*.md` | LLM prompts | No cap | Versioned in-file with changelog and eval |
| `decisions/ADR-*.md` | One decision per file | 1 page | Never edited; superseded by new ADRs |

### Infrastructure layer (rules + process + state)

| Doc | Purpose | Cap |
|---|---|---|
| `CLAUDE.md` | The rulebook (§0–§23) | N/A — the rulebook |
| `SOURCE_INDEX.md` | Live index of all source docs | 1 page |
| `TESTING.md` | Testing philosophy | 2 pages |

### Guides (how to use Shark)

| Doc | Purpose |
|---|---|
| `SHARK_FRAMEWORK.md` | This explainer |
| `NEW_PROJECT_CHECKLIST.md` | 15-min setup ritual for a new project |
| `DUMP_AND_ORGANISE_GUIDE.md` | Turn scattered notes into source-of-truth docs |
| `CREDENTIAL_PROVISIONING_GUIDE.md` | Automated credential provisioning via Claude in Chrome |
| `SOLO_DEVELOPER_WORKFLOW.md` | Daily workflow for a solo builder |

### Archives

| Folder | Purpose |
|---|---|
| `source-materials/` | Original scattered uploads, kept for reference |
| `snapshots/` | Milestone freezes of all source docs, rare |

---

## 6. The load-bearing rules

The framework works if these are followed. Weakens fast if not.

### §0 Human-in-the-Loop

Every output from Cowork or Claude Code passes through a human review gate. Four gates: spec, plan, update, ship. The human owner is never out of the loop. Silent edits are forbidden.

### §1b Investigation Loops

Cowork uses Claude Code as a research instrument when strategy questions need code-level facts. Three brief types exist — INVESTIGATION (read-only research), IMPLEMENTATION (build a feature), DEBUG (fix a bug) — each with its own shape. Investigations never silently transition into implementations. Findings from investigations automatically trigger source-of-truth doc update proposals.

### §20 Source Discipline

Cowork and Claude Code answer from source documents, not memory. If a question isn't covered by a source doc, they say so — and either propose writing one, or open an investigation loop (§1b) to get the ground truth from code.

### §21 Update Protocol

No silent edits. Every proposed update uses a fixed shape (File / Type / Reason / Adding / Removing / Net / Diff) and waits for owner approval. Updates are triggered by **commitment signals** (language of decision, explicit scoping, resolved contradiction), not by time of day.

### §22 Bloat Discipline

Hard size caps per doc type. Every modification shows what's being removed as well as added. Automatic pruning at milestones.

---

## 7. How a real working session runs

Not a time-of-day schedule — a **trigger-driven rhythm**.

### Session opens

- Cowork (or Claude Code) reads `SOURCE_INDEX.md` first
- Reads 2-3 source docs relevant to what you're working on
- Confirms ready

### Work happens in natural chunks

- Strategy discussion → decision reached → commitment trigger fires → Cowork proposes update → you review 30 seconds → approved → work continues
- Feature scoping → explicit scope agreed → trigger fires → new feature spec proposed → reviewed → spec added → work continues
- Code session with Claude Code → plan gate (§5) → questions answered → code shipped → live-test run → feature spec status updates

**Every update happens when it's warranted.** Not batched. Not delayed to end of session. Real-time capture of real decisions.

### Session closes

- One-line log entry in `CLAUDE.md` §23 session history
- `SOURCE_INDEX.md` reflects any status changes
- Nothing more ceremonial than that

### Every 90 days

- Cowork proposes a freshness pass — 5 random docs, "still accurate?"
- Owner reviews in 15 min, prunes stale content

---

## 8. What Shark is NOT

**Not a replacement for judgment.** Shark holds structure; you hold taste. Rubber-stamping proposals breaks the system silently.

**Not a productivity multiplier on day one.** The 30 seconds per update is a small cost. What Shark does is keep you *oriented* over weeks and months, which is different from fast.

**Not set in stone.** The rules are starting points. After 2-3 projects, you'll find parts that don't fit your workflow. Change them.

---

## 9. When to use each guide

**Starting a new product** → `NEW_PROJECT_CHECKLIST.md`
**Have scattered context to organise** → `DUMP_AND_ORGANISE_GUIDE.md`
**Need API credentials for dev/test** → `CREDENTIAL_PROVISIONING_GUIDE.md`
**Question about daily workflow** → `SOLO_DEVELOPER_WORKFLOW.md`
**Question about a rule** → `CLAUDE.md` §0–§22
**Question about a past decision** → relevant `decisions/ADR-*.md`
**Question about what to build next** → `DEVELOPMENT_PLAN.md` + current DP-NN-*.md

---

## 10. Framework version

**Shark v1.0** — built across several sessions to codify a way of working.

After 2-3 projects use it, expect v1.1 with real-world refinements. This file, the rules in CLAUDE.md, and the templates all evolve together. Treat Shark as living infrastructure, not a one-time download.

---

**Last updated:** [YYYY-MM-DD]
**Maintained by:** [Name]
