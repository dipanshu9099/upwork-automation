# IMPLEMENTATION BRIEF — Phase 6: Portfolio Re-ingestion

**Type:** IMPLEMENTATION
**For:** Claude Code
**Prepared by:** Cowork (Shark framework)
**Date:** 2026-04-23
**Reference:** CLAUDE.md §23, lib/gemini/retrieve.ts, app/admin/portfolio/actions.ts

---

## Universal Debug Rule (§3)
Read the actual files before confirming any approach. The hypothesis
might be wrong. Find edge cases and existing workflow conflicts, and
address them.

## Plan-Before-Build (§5)
Before writing a single line of code, present:
1. Where you intend to create/modify files and why
2. Your proposed implementation plan (numbered steps)
3. Any questions or confirmations needed before proceeding

---

## Problem

The existing 219 portfolio items in Supabase were ingested with
scrambled field mapping — content from the description ended up in
`tech_stack`, tech stack content ended up in `use_cases`, etc. The
semantic embeddings are roughly correct (the right words are in the
vector) but the formatted text returned to the pipeline bots is
garbled, so the proposal bots produce weak context paragraphs.

Additionally, the first 4 items in the docx are **inspiration
references** (competitor/benchmark studios), not HestaBit's own work.
These should never be presented in a proposal as "we built this."

---

## Source document

The portfolio docx is already on disk at:
```
scripts/portfolio/HestaBit-Portfolio.docx
```

Copy it there from the uploads directory before running:
```
cp /sessions/happy-dreamy-cray/mnt/uploads/HestaBit-Portfolio-9a841055.docx \
   scripts/portfolio/HestaBit-Portfolio.docx
```

---

## What to build

A one-time Node.js/TypeScript script:
```
scripts/ingest-portfolio.ts
```

Run with:
```
npx ts-node --project tsconfig.json scripts/ingest-portfolio.ts
```

The script must:
1. Parse the docx into structured records (see Parsing Rules below)
2. Clear all existing rows from `portfolio_items`
3. For each parsed record: embed → insert (same flow as `addPortfolioItem`)
4. Print a summary on completion

---

## Parsing Rules — READ CAREFULLY

The docx has two distinct zones:

### Zone 1 — Inspiration references (SKIP these entirely)
Lines 1–155 (before the heading "AI / ML / GENERATIVE AI PROJECTS").
These are 4 competitor/benchmark references (Immersive Garden, Lusion,
The First The Last Agency, Olha Lazarieva Portfolio).
**Do NOT ingest these.** They are not HestaBit projects.
Detection: everything before the first all-caps section heading.

### Zone 2 — Real HestaBit projects (INGEST these)
Everything from "AI / ML / GENERATIVE AI PROJECTS" onwards.
~145 real projects across multiple categories.

---

### Project structure within Zone 2

Each project follows this pattern (with variations — see notes below):

```
[number]. [Project Name]

[optional: 🔗 URL or plain URL line]

[Description paragraphs — one or more]

[optional section: "Use Case" or "Use Cases"]
[use case bullets or paragraphs]

[optional section: "Tech Stack" or "Technologies:" or "Technologies "]
[tech stack content — comma list, bullets, or table]
```

**Section headings that signal tech stack** (treat all as equivalent):
- `Technologies:`
- `Technologies :`
- `Technologies `  (with trailing space/newline)
- `Tech Stack`
- `Tech Stack `

**Section headings that signal use cases** (treat all as equivalent):
- `Use Case`
- `Use Cases`

**Category headings** (all-caps lines that divide sections — use to
set the `category` field for all projects that follow):

| Heading in docx | category value |
|---|---|
| AI / ML / GENERATIVE AI PROJECTS | AI/ML |
| Web Scraping, Automation, Bots | Web Scraping |
| Chrome Extensions | Other |
| FULL-STACK WEB APPS & SAAS PLATFORMS | Web App |
| FINTECH & FINANCIAL PLATFORMS | Web App |
| GAMING PROJECTS | Web App |
| SHOPIFY, E-COMMERCE & PRODUCT CONFIGURATORS | Web App |
| REAL ESTATE PROJECTS | Web App |
| STRIPE / PAYMENT-INTEGRATED PLATFORMS | Web App |
| HEALTHCARE, MEDICAL & HIPAA SYSTEMS | Web App |
| MISCELLANEOUS / CORPORATE / MEDIA / LANDING PAGES / BLOGS | Web App |
| Mobile App | Mobile App |

---

### Field mapping

| DB field | What to put there |
|---|---|
| `name` | The project title (strip leading number + period, e.g. "1. AI Scraper" → "AI Scraper") |
| `url` | The URL if present on the line immediately after the name (🔗 prefix or plain https://), else null |
| `description` | All paragraphs between the name/URL and the first section heading (Use Case / Tech Stack). If no section headings exist, everything after name/URL is description. |
| `use_cases` | Content under "Use Case" / "Use Cases" heading, if present. Else null. |
| `tech_stack` | Content under "Tech Stack" / "Technologies:" heading, if present. Else null. |
| `category` | From the category heading currently in scope (see table above) |
| `embedding` | Embed the concatenation of: name + " " + description + " " + (use_cases ?? "") + " " + (tech_stack ?? "") |

**Important:** For `tech_stack`, if the section is a bullet list,
collapse it to a comma-separated string. If it's a table (like the
"AI Call Review System" which has a markdown table), extract only the
right-hand column values and join them. The goal is a clean,
readable string — not raw markdown.

---

### Parsing edge cases to handle

1. **Projects with no Tech Stack section** — ingest anyway; `tech_stack`
   is null. The description is enough for embedding.

2. **Projects with no URL** — `url` is null. Fine.

3. **Very long projects** (e.g. "Web Scraping and Procurement Platform"
   has 5 numbered sub-sections) — treat all content between the name
   and the next numbered project as this project's content. Don't
   break sub-sections into separate records.

4. **Emoji in project names** (e.g. some have decorative emoji) — strip
   emoji from the `name` field but keep them in description if present.

5. **Numbered items that are sub-sections, not projects** — e.g. "1.
   Automatic Product Discovery", "2. Visual Procurement Catalog" under
   "Web Scraping and Procurement Platform". These are sub-sections of
   the parent project. Detect them by the fact that they appear *after*
   the project's description has started and *before* the next
   top-level numbered project. Do not ingest them as separate records.

6. **"Use Case" vs "Use Cases" vs numbered use case lists** — all
   treated the same: capture all content under that heading until the
   next section heading or next project.

7. **Unicode bullets (–, •, -)** — collapse bullet lines into
   readable prose in the stored text (join with ", " or keep as
   newline-separated — either is fine, just be consistent).

8. **Markdown table for tech stack** (only appears in "AI Call Review
   System") — extract the right-hand column of the table (the tool/tech
   values) and join them as a comma-separated string.

---

## Implementation approach

Use `mammoth` (already available as npm package or install it) to
convert the docx to plain text first, then parse the plain text.
Do NOT try to parse the raw docx XML — it's fragile.

```
npm install mammoth
```

Alternative: use the `pandoc` CLI if available in the environment:
```bash
pandoc HestaBit-Portfolio.docx -t plain -o portfolio.txt
```
Then read `portfolio.txt` in the script. Pandoc is more reliable for
complex docx formatting. Use whichever approach is more robust.

---

## Embedding + insert flow

Reuse the same logic as `app/admin/portfolio/actions.ts`:
- Import `embedDocument` from `lib/gemini/embed`
- Import `createServiceClient` from `lib/supabase/service`
- Load `.env.local` via `dotenv`

**Rate limit:** Add a 200ms delay between each embed call to avoid
hitting the Gemini embedding API rate limit. With ~145 projects, the
full run will take ~30 seconds.

---

## Step-by-step execution plan the script must follow

1. Parse docx → array of `ParsedProject[]`
2. Log: `Parsed N projects. First 5: [names...]` — so owner can spot-check before delete
3. **Pause and ask for confirmation before deleting:** print
   `"About to delete all existing portfolio_items and re-insert N records. Press Enter to continue or Ctrl+C to abort."`
   Use `readline` to wait for Enter.
4. Delete all rows: `DELETE FROM portfolio_items`
5. For each project: embed → insert → log `[N/total] Inserted: [name]`
6. On completion: log `Done. Inserted N items. Skipped M (embed errors).`

**Fail-open per item:** if embed or insert fails for one project, log
the error and continue. Do NOT abort the whole run.

---

## What the script does NOT do

- Does not modify any existing app code
- Does not touch `lib/gemini/retrieve.ts` or the pipeline
- Does not add new DB columns
- Does not run automatically — it is a one-time manual script

---

## Success criteria

1. Script runs to completion without crashing
2. `portfolio_items` table has between 130–160 rows (the 4 inspiration
   references are excluded; some projects may be skipped if embed fails)
3. Spot-check 5 random items in Supabase: `name` is clean, `description`
   is the project narrative (not tech stack), `tech_stack` is a clean
   tech list (not a use case paragraph)
4. Run the pipeline on a job post that should match a known project
   (e.g. a scraping job → should surface the Driving Test Bot or
   LinkedIn Scraper) and verify the correct project appears in the
   Vercel logs under `[gemini/retrieve]`
5. `npx tsc --noEmit` exits 0
