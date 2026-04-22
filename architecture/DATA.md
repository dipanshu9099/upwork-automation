# DATA.md

**Hard cap:** 3 pages. If larger, split per-domain (e.g. `DATA-users.md`, `DATA-content.md`).

**Purpose:** The data model with *semantic meaning*. Not just the SQL — why each table exists, what the relationships mean, which columns are load-bearing, and which are decorative. Cowork reads this file before proposing any data model change; Claude Code reads it before writing any migration.

**Last reviewed:** [YYYY-MM-DD]
**Schema source of truth:** [e.g. `migrations/` folder in the repo, Supabase dashboard, Prisma schema file]

---

## 1. Core entities

[One subsection per major entity. Keep it tight — this is not auto-generated schema docs, it's the *reasoning* behind the schema.]

### Entity: [name]

**What it represents:** [1 sentence, plain language. "A Lead represents a single person we're trying to contact, across all outreach channels."]

**Why it's its own table:** [1 sentence. Why not inline into another entity? The reason matters.]

**Key columns:**

| Column | Type | Purpose | Load-bearing? |
|---|---|---|---|
| `id` | uuid | primary key | Yes |
| `[name]` | [type] | [1-line purpose] | Yes/No |

"Load-bearing" means: if this column is wrong or missing, the feature breaks. Decorative columns (display names, timestamps purely for auditing) can go in a less prominent place or be omitted from this table.

**Relationships:**

- `[other_entity]`: [1 sentence on the relationship and cardinality]

**Quirks / gotchas:**

- [anything non-obvious that has caused bugs — e.g. "`status` column has 6 values but only 4 are actively used; the other 2 are legacy from v1 and should not be written"]

---

### Entity: [next entity]

[Same structure]

---

## 2. Accumulating containers (per §9 Data-Layer Merge Rule)

[If the product uses any JSONB columns, nested objects, metadata blobs, settings records — list them here. These are the fields that require merge-not-replace discipline.]

| Table.column | Purpose | Writers (routes / modules that write to this) |
|---|---|---|
| `leads.metadata` | Enrichment data from various sources | Apollo enricher, manual notes, LLM tags |
| | | |

**Rule:** Every writer to an accumulating container must fetch-merge-write. Never replace.

---

## 3. Index strategy

[Which columns are indexed, and why. This prevents performance regressions from someone adding a slow query later.]

| Table | Index | Why |
|---|---|---|
| | | |

---

## 4. Soft deletes vs hard deletes

[Project-wide convention. Do rows get marked `deleted_at` and kept, or actually removed? Same convention for all tables or exceptions per entity?]

---

## 5. Migration discipline

[How schema changes happen in this project:]

- All schema changes via migration files (no direct DB edits)
- Migrations are one-way by default; flag any that need rollback support
- Destructive migrations (DROP column, DROP table) require explicit owner approval per §5 Plan-Before-Build
- Backfills that cost LLM calls or significant compute require cost estimate before running

---

## Calibration notes

When Cowork proposes a DATA.md update:
- Schema change + this doc update go together, or the doc drifts
- If adding an entity, flag whether it deserves its own section or can fit in an existing one
- If a column is being deprecated, mark it in the "Quirks" subsection before the migration drops it
