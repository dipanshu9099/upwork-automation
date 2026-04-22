# Project Template

**Purpose:** A drop-in skeleton for starting any new product built with Claude Cowork + Claude Code. Copy this folder to your new project's repo root, run through the NEW_PROJECT_CHECKLIST.md, and you're ready to go.

---

## What's in this folder

```
project-template/
├── README.md                                 ← you are here
├── SOURCE_INDEX.md                           ← 1-page live index of all source docs
├── TESTING.md                                ← testing philosophy (stable)
│
├── product/
│   ├── VISION.md                             ← what + who + why (500 words cap)
│   └── FEATURES/
│       └── D_TEMPLATE-feature-name.md        ← copy this per feature
│
├── architecture/
│   ├── STACK.md                              ← tech choices + reasoning
│   ├── SYSTEM.md                             ← component map
│   └── DATA.md                               ← data model + semantic meaning
│
├── prompts/
│   └── TEMPLATE-prompt-name.md               ← copy this per prompt
│
├── decisions/
│   └── ADR-TEMPLATE.md                       ← copy this per decision
│
├── source-materials/                         ← your original scattered uploads
└── snapshots/                                ← milestone snapshots only
```

Not included in this template but belongs at the repo root:
- `CLAUDE.md` — the universal working rules (copy from the separate file)
- `NEW_PROJECT_CHECKLIST.md` — the 15-minute setup ritual (copy from the separate file)
- `CREDENTIAL_PROVISIONING_GUIDE.md` — Claude-in-Chrome credential flow (copy from the separate file)
- `DUMP_AND_ORGANISE_GUIDE.md` — how to turn scattered input into this structure (copy from the separate file)
- `.env.local` (gitignored) — credentials
- `.gitignore` — must include `.env*`, `.env.local`, `source-materials/` if sensitive

---

## How to use this template (step by step)

### Step 1 — Copy the template into your new project repo

```bash
cp -r project-template/* <your-new-repo>/
cp CLAUDE.md <your-new-repo>/
cp NEW_PROJECT_CHECKLIST.md <your-new-repo>/
cp CREDENTIAL_PROVISIONING_GUIDE.md <your-new-repo>/
cp DUMP_AND_ORGANISE_GUIDE.md <your-new-repo>/
cd <your-new-repo>
```

### Step 2 — Customise §23 of CLAUDE.md

Open `CLAUDE.md`, scroll to §23 (Project-Specific Context), fill in project name, owner, stack, repo URL, stack-specific adaptations. Everything above §23 stays untouched.

### Step 3 — Dump your scattered context into `source-materials/`

Whatever you have — old notes, half-finished specs, competitor research, PDFs, Slack exports, bullet-point brain dumps — put it all in `source-materials/`. No structure required. It's not authoritative yet.

### Step 4 — Run the dump-and-organise flow

Open the project in Claude.ai, upload `source-materials/` contents to the project knowledge, and follow `DUMP_AND_ORGANISE_GUIDE.md`. Cowork will inventory, surface contradictions, ask you the questions that fill the gaps, and draft the initial source-of-truth docs.

### Step 5 — Approve the drafts, populate `SOURCE_INDEX.md`

As each source doc is approved, update its row in `SOURCE_INDEX.md` with status and owner.

### Step 6 — Start working

From now on, every session begins by Cowork/Code reading `SOURCE_INDEX.md` first (§20 Source Discipline), and any updates to source docs follow the §21 Update Protocol.

---

## The rules that govern these files

These files only work if the rules in `CLAUDE.md` are actually followed. The critical ones:

- **§20 Source Discipline** — Cowork/Code answer from these documents, not memory
- **§21 Update Protocol** — Updates are proposed with a fixed-shape diff, approved by owner, never silent
- **§22 Bloat Discipline** — Hard size caps per doc type, kill-more-than-create, automatic pruning at milestones

If you find yourself drifting (Cowork updating silently, docs bloating, decisions re-litigated), re-read §20–§22 and tighten up. The framework only holds if the discipline holds.

---

## What NOT to do

- **Don't edit files directly without going through the Update Protocol once the system is established.** The protocol exists to catch drift and bloat. Bypassing it "just this once" is how drift starts.
- **Don't skip SOURCE_INDEX.md updates.** If a new ADR lands but the index doesn't list it, the index is lying and the system is already broken.
- **Don't let `source-materials/` become a second source of truth.** It's an archive. Once a fragment's content is captured in a proper source doc, the fragment is superseded — reference the source doc, not the fragment.
- **Don't create documents that aren't in this template.** If you feel you need one, propose it first (with a reason). Framework creep is worse than missing docs.

---

## How to extend this template

After 2-3 projects using this template, you'll notice patterns that recur across your products. When you do:

1. If the pattern is universal (every product needs X) → add it to this template
2. If the pattern is family-specific (every "Right" product needs X) → consider a shared cross-project knowledge layer, not a template addition
3. If the pattern is one-off → don't generalise, just handle it in that project's `§23 Project-Specific Context`

The goal is to keep this template minimal and honest. Every added file is a file the next project has to maintain even if irrelevant.
