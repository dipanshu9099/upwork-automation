# New Project Setup Checklist — Cowork + Claude Code

**Run this every time you start a new product using Cowork (Claude.ai project) + Claude Code (terminal/IDE). Target: 20 minutes for setup phases (0-2 and 4), plus 30-90 minutes for Phase 3 dump-and-organise (which can be split across sessions).**

---

## Phase 0 — Before you open anything (2 min)

- [ ] **Decide the project name** — one word if possible, used everywhere (Claude.ai project name, repo name, Slack channel, spec IDs)
- [ ] **Decide the stack** — write it down in one line: `<frontend> + <backend> + <DB> + <hosting> + <LLM>`. This drives §20 and half the tooling decisions
- [ ] **Decide the owner email** — the single human Claude Code asks when it hits the Access Request Rule
- [ ] **Confirm Claude in Chrome is installed and enabled** — required for §4b automated credential provisioning. If this is your first project, complete Part 1 of `CREDENTIAL_PROVISIONING_GUIDE.md` first. (One-time setup, ~30 min.)
- [ ] **List the 3rd-party services this project will need** — at minimum, jot down: LLM provider, database, hosting, and any product-specific APIs (Apollo, SendGrid, Stripe, etc.). You'll provision keys for each in Phase 1.

---

## Phase 1 — Repo + Claude Code side (8 min)

- [ ] **Create the repo** (GitHub / GitLab / wherever)
- [ ] **Initialise basic structure** — `README.md`, `.gitignore`, language-appropriate project file (`package.json`, `pyproject.toml`, etc.)
- [ ] **Add `.gitignore` entries for secrets** — `.env*`, `.env.local`, `.env*.local`, `secrets/`, any platform equivalents
- [ ] **Create `.env.local`** (or platform equivalent) as an empty placeholder. Confirm it is gitignored: `git status` should NOT show it
- [ ] **Copy the universal `CLAUDE.md` to the repo root**
- [ ] **Copy the source-of-truth skeleton to the repo** — use `linkedin-right-skeleton/` as the template. Copy the entire folder structure (product/, architecture/, prompts/, decisions/, source-materials/, snapshots/) plus the root files (SOURCE_INDEX.md, TESTING.md, DUMP_AND_ORGANISE.md, README.md, _FEATURE_TEMPLATE.md, _ADR_TEMPLATE.md, _PROMPT_TEMPLATE.md).
- [ ] **Fill in §24 of `CLAUDE.md`** — do NOT touch §1–§23:
  - [ ] Project name, owner, stack, repo URL
  - [ ] Background work primitive for this stack (Next.js `after()` / Electron IPC queue / Celery / BGTaskScheduler / etc.)
  - [ ] Ship-clean commands for this stack (exact commands: `npx tsc --noEmit`, `ruff check .`, `cargo clippy`, etc.)
  - [ ] Access tokens list (names only — never values)
  - [ ] Test / staging environment (URL or local setup)
  - [ ] Key external services (DBs, queues, APIs, device targets)
- [ ] **Run typecheck + lint once, note the baseline** — record the number and date in §24 (`Lint / typecheck baseline: N problems as of <date>`)
- [ ] **Commit CLAUDE.md + skeleton** — first commit of the repo, message: `chore: add CLAUDE.md working rules (universal v1 + project §24) + source-of-truth skeleton`
- [ ] **Provision 3rd-party credentials via §4b flow** — for each service listed in Phase 0:
  - Sign up / log in yourself (owner handles auth)
  - Open the service's API panel in Chrome
  - Use Cowork to provision the key per `CREDENTIAL_PROVISIONING_GUIDE.md` Part 2
  - Verify the read-back (first 8 chars match)
  - Confirm `.env.local` is gitignored and contains the new variable
- [ ] **Open Claude Code in the repo root** and confirm it has picked up CLAUDE.md (ask it: *"What working rules are you operating under? Cite section numbers."* — it should reference §1–§24, including §4b, §21, §22, §23)

---

## Phase 2 — Cowork side (Claude.ai project) (5 min)

- [ ] **Create a new Claude.ai project** — same name as the repo
- [ ] **Upload `CLAUDE.md` to the project's Knowledge** (same file you committed to the repo — keep them in sync manually for now)
- [ ] **Upload `SOURCE_INDEX.md` to the project's Knowledge** — this is what Cowork reads first every session per §21
- [ ] **Upload the source-of-truth skeleton files to the project's Knowledge** — VISION.md, STACK.md, SYSTEM.md, DATA.md, TESTING.md. They're mostly empty at this stage; that's fine. Phase 3 fills them in.
- [ ] **Paste the Cowork custom-instructions prompt** into the project's Custom Instructions / Project Instructions field:

  ```
  You are my Cowork collaborator for [PROJECT NAME].

  The full working rules for this project are in the CLAUDE.md file
  in this project's knowledge. Follow them. Cite section numbers
  (§1–§23) when you reference a rule in a brief.

  Your job: strategy, specs, briefs, logs, and instructions to Claude Code.
  You do NOT write code. Claude Code writes code.

  At the start of every session, per §21 Source Discipline:
  1. Read SOURCE_INDEX.md first
  2. Read the 3 source-of-truth documents most relevant to today's topic
  3. Answer from sources, not memory. Cite the source document and section.

  Before delivering any brief, self-check against §2 (Pre-Delivery
  Self-Check) and §1 (Briefing Rules). If you violated them, fix the
  brief before handing it over.

  When a decision is made during our conversation (per §22 Update
  Protocol triggers — language of decision / explicit scoping /
  resolved contradiction), propose an update to the relevant source
  document using the fixed shape:
  File / Type / Reason / Adding / Removing / Net / Diff.
  Wait for my approval. Never update silently.

  Watch for bloat (§23). Every proposed update must show what's
  being removed alongside what's being added. Respect hard caps
  (VISION 500w, STACK 500w, SYSTEM 3pp, feature specs 2pp, ADRs 1pp).

  Tone: warm, human, consultative. No corporate jargon, no hype.
  Push back on weak logic. Correct my English grammar when I slip.
  Structured outputs (tables, numbered lists, decision matrices) when
  analysis is involved.

  When I ask for a brief for Claude Code, deliver it in this shape:
  symptom → expected behaviour → hypothesis (flagged as such) →
  the Universal Debug Rule line (§3) → Plan-Before-Build instruction
  (§5) → Access reminders (§4 + §4b).
  ```

- [ ] **Replace `[PROJECT NAME]`** with the actual project name
- [ ] **Sanity-check Cowork** — open a fresh chat inside the project and ask: *"What are your operating rules? Cite the section numbers, including §21–§23."* It should reference all sections. If it doesn't mention §21–§23, the updated knowledge files aren't loading — re-upload.

---

## Phase 3 — Dump-and-Organise the source-of-truth (30-90 min)

This phase populates the empty source-of-truth documents with real project content, per §21.

- [ ] **Gather scattered materials you already have** — old notes, half-specs, competitor research, Slack exports, architecture sketches. Don't clean them first.
- [ ] **Upload everything to the Claude.ai project** (or drop into `source-materials/` in the repo)
- [ ] **Run the 8-phase dump-and-organise flow** per `DUMP_AND_ORGANISE.md`:
  1. Dump everything (done above)
  2. Cowork inventories — lists files, categorises, **surfaces contradictions explicitly**
  3. You answer Cowork's questions + resolve contradictions
  4. Cowork drafts source-of-truth docs one at a time (VISION → STACK → SYSTEM → DATA → TESTING)
  5. Cowork proposes ADRs for decisions that were made but never recorded
  6. Archive source materials into `source-materials/` (don't delete)
  7. Update SOURCE_INDEX.md to reflect current document statuses
  8. Smoke test — verify Cowork cites sources instead of paraphrasing from memory
- [ ] **Commit the populated skeleton** — message: `feat: populate source-of-truth from initial dump-and-organise`

**Skip this phase if:** you're starting completely greenfield with no prior context. In that case, Cowork will help you draft VISION.md first and build outward from there.

---

## Phase 4 — First feature kick-off (3 min)

- [ ] **Write D1 spec** — the first feature, via Cowork, using `_FEATURE_TEMPLATE.md` as the shape
- [ ] **Update SOURCE_INDEX.md** — add D1 row with status 🟡 IN PROGRESS
- [ ] **Approve the spec** (§14 spec gate) — you explicitly write "D1 approved" in the session log before any code is written
- [ ] **Write the first brief for Claude Code** — following §1 Briefing Rules:
  - Symptom + expected behaviour
  - Hypothesis (flagged)
  - Universal Debug Rule line (§3)
  - Plan-Before-Build instruction (§5)
  - Access reminders (§4 + §4b)
- [ ] **Hand the brief to Claude Code** and wait for its plan + questions (§5). Do NOT let it start coding before questions are answered

---

## Ongoing — Every session after Session 1

- [ ] **Start every Cowork session** by confirming source-discipline: *"Read SOURCE_INDEX.md and the top 3 relevant docs for today's topic before answering."* (Per §21)
- [ ] **Start every Claude Code session** by pointing it at CLAUDE.md: *"Refresh your understanding of CLAUDE.md, especially §24. What's the current state?"*
- [ ] **Log every session in §24 → Session History** (§15 pattern): session number, date, scope, commits shipped, what's pending, decisions made
- [ ] **Update §24 → Current State** every session — don't just append, rewrite the top-level summary
- [ ] **Update the Build Status Table** (§17) — exact statuses only (✅ 🟡 🔴 ⛔ 🚫)
- [ ] **Review Cowork's update proposals** (§22) — approve / reject / edit. Never let them pile up unreviewed.
- [ ] **When a decision is made:** Cowork should propose an ADR (§22 triggers). Approve the proposal, ADR gets written to `decisions/`.
- [ ] **After every commit:** Claude Code runs ship-clean checks (§10) and reports the new lint count. If it rose, fix before pushing
- [ ] **After every feature:** live-test checklist (§12) must pass before moving to the next feature
- [ ] **When a spec is superseded:** mark RETIRED in SOURCE_INDEX.md with a pointer to the replacement — do NOT delete (§16)
- [ ] **When a new failure mode is found:** log it in §18 — failure mode / root cause / prevention rule / example commit
- [ ] **Every 90 days:** run a freshness pass per §23 — Cowork picks 5 source-of-truth docs, asks "still accurate?", you prune as needed

### Calibration period (first 2-4 weeks of every new project)

During the first 2-4 weeks, Cowork's proposal judgment is being calibrated to your taste:

- [ ] If Cowork over-proposes (every musing becomes an ADR) → tell it to tighten §22 triggers
- [ ] If Cowork under-proposes (real decisions go unrecorded) → tell it to be more proactive
- [ ] If Cowork's proposal format is wrong → remind it of §22's fixed shape
- [ ] After ~10 corrections, the "why I'm proposing this" line in proposals can drop

---

## Red flags that mean you skipped a step

| Symptom | Likely skipped step |
|---|---|
| Claude Code starts coding without asking questions | §5 Plan-Before-Build not enforced in your brief |
| Cowork keeps naming specific files in briefs | §1 Briefing Rules — Cowork is prescribing, not describing |
| A bug fix ships and the real root cause was elsewhere | §3 Universal Debug Rule skipped — Claude Code didn't read the code first |
| Commit N+1 fails to deploy because of a type error in commit N | §10 Ship-Clean not run before commit N |
| Silent data loss in a JSONB / settings column | §9 Data-Layer Merge violated — someone wrote a fresh object |
| Background job writes nothing in production but works locally | §7 Background Work Rule — using fire-and-forget instead of the platform primitive |
| "Cleared it with Claude, all good" but no DB verification | §12 Live-Test Discipline — UI check is not a data check |
| Decision from 3 weeks ago gets re-litigated | §15 Session Logging + §21 Source Discipline — no ADR was written |
| Cowork paraphrases from memory instead of citing a source doc | §21 Source Discipline — SOURCE_INDEX.md not being read at session start |
| VISION.md has grown to 2 pages | §23 Bloat Discipline — hard caps not enforced |
| Cowork silently rewrote a doc without asking | §22 Update Protocol violated — this should never happen |
| ADR folder is empty but decisions have clearly been made | §22 commitment triggers not firing when they should |

When you hit one of these, don't just fix the symptom — add it to §18 (Known-Failure-Mode Log) so the next project catches it one phase earlier.

---

## Sync discipline between the two CLAUDE.md copies

There are two copies of `CLAUDE.md` (and same for SOURCE_INDEX.md + every source-of-truth doc):
1. **Repo root** — read by Claude Code
2. **Claude.ai project knowledge** — read by Cowork

**They must stay identical.** When you update one (usually after a session adds to §24 or approves a source-of-truth update from §22), update the other in the same sitting. Drift between the two is how Cowork and Claude Code start working from different rulebooks — which is the exact problem this system is designed to prevent.

Option to automate later: a short script that reads the repo files and posts them to the Claude.ai project knowledge via API. Not needed for v1 — just do it manually for now.

---

## First-session smoke test (optional but recommended)

Before trusting the setup, run this smoke test in a fresh Cowork chat:

1. *"What is §7?"* → Cowork should summarise the Background Work Rule with platform examples
2. *"What is §21?"* → Cowork should summarise Source Discipline and mention SOURCE_INDEX.md
3. *"What does this product do?"* → Cowork should cite `product/VISION.md` (not paraphrase from memory). If VISION.md isn't filled in yet, it should say so and propose a dump-and-organise session.
4. *"I want to add a feature that writes user preferences to a JSONB column. Write me a brief for Claude Code."* → Cowork should produce a brief that (a) describes the feature, (b) does NOT name specific files, (c) includes the Universal Debug Rule line, (d) references §9 Data-Layer Merge, (e) ends with Plan-Before-Build instruction
5. *"We just decided to use Redis for caching. What should happen?"* → Cowork should recognise this as a §22 commitment trigger and propose an ADR in the fixed shape (File/Type/Reason/Adding/Removing/Net/Diff)
6. *"Correct my grammar: 'I has been thinking about this feature since last week'"* → Cowork should correct `has → have` and explain why

If any of these six fails, the custom instructions or knowledge files aren't loading properly — re-check Phase 2.
