# SYSTEM.md

**Hard cap:** 3 pages (~1500 words). If it grows beyond, split into `architecture/COMPONENTS/<component>.md` files.

**Purpose:** How the system is put together. What runs where, what talks to what, which components exist and what they do. Not a code-level deep dive — a one-screen-at-a-time map a new collaborator could use to orient themselves.

**Last reviewed:** [YYYY-MM-DD]

---

## 1. Deployment topology

[One paragraph + optional simple ASCII diagram. What machines / services are running, and where. Example:]

```
[Browser / Electron app]
        │
        ▼
[API server on Vercel] ──► [Anthropic API]
        │
        ▼
[Postgres on Supabase]
```

## 2. Components

[One subsection per major component. 2-3 paragraphs each. If a component needs more than 3 paragraphs, split it into its own file in `architecture/COMPONENTS/`.]

### Component A: [name]

**Purpose:** [what it does]
**Location:** [where the code lives — folder path]
**Key interfaces:** [what it exposes to other components]
**Dependencies:** [what it needs to work]
**Quirks / gotchas:** [anything non-obvious that has caused bugs]

### Component B: [name]

[Same structure]

## 3. How components talk to each other

[Describe the contracts between components. API shapes? Event names? Message queues? Shared DB tables? Be specific enough that a new collaborator could pick up one component without reading all the others.]

## 4. Where state lives

[Important enough to deserve its own section. For every kind of state the product has — user session, feature config, cached data, uploaded files — name the single source of truth. If state is duplicated anywhere, flag it.]

| State | Single source of truth | Replicated / cached where |
|---|---|---|
| User session | | |
| Lead records | | |
| LLM-generated content | | |

## 5. Background work

[Per §7 Background Work Rule. Name the platform's background primitive and where it's used.]

**Background primitive:** [e.g. Next.js `after()`, Electron IPC queue, BullMQ worker]
**Jobs currently running:** [list with 1-line purpose each]

## 6. Error handling

[Per §6 Fail-Open Rule. Describe the project's convention for logging, error recovery, and user-facing error UX.]

---

## Calibration notes

When Cowork proposes a SYSTEM.md update:
- Diagram or component descriptions — does the change require updating both?
- If a component grows past 3 paragraphs, propose splitting it out BEFORE adding more detail
- If this file approaches 1500 words, propose splitting the most detailed component into `COMPONENTS/<name>.md`
