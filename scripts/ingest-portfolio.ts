/**
 * Portfolio re-ingestion (Phase 6).
 *
 * Modes:
 *   tsx scripts/ingest-portfolio.ts --dry-run
 *     Parse + print JSON + print per-category breakdown. No DB writes.
 *   tsx scripts/ingest-portfolio.ts
 *     Snapshot existing rows → readline confirm → DELETE → embed + insert
 *     every parsed project with a 200ms throttle.
 *
 * Reads from source-materials/HestaBit-Portfolio.docx by default. Override
 * with the first positional CLI arg.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { config as loadEnv } from "dotenv";
import mammoth from "mammoth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { embedDocument, EMBEDDING_DIMENSIONS } from "../lib/gemini/embed";

loadEnv({ path: ".env.local" });

// ---------- Config ----------

const DEFAULT_DOCX_PATH = "source-materials/HestaBit-Portfolio.docx";
const EMBED_THROTTLE_MS = 200;

// Categories observed in the actual docx. Keys compared uppercase, whitespace-
// collapsed. Values are the finite category set stored on portfolio_items.
const CATEGORY_MAP: Record<string, string> = {
  "AI / ML / GENERATIVE AI PROJECTS": "AI/ML",
  "WEB SCRAPING, AUTOMATION, BOTS": "Web Scraping",
  "CHROME EXTENSIONS": "Other",
  "FULL-STACK WEB APPS & SAAS PLATFORMS": "Web App",
  "EDTECH / LMS / ELEARNING PLATFORMS": "Web App",
  "FINTECH & FINANCIAL PLATFORMS": "Web App",
  "GAMING PROJECTS": "Web App",
  "SHOPIFY, E-COMMERCE & PRODUCT CONFIGURATORS": "Web App",
  "REAL ESTATE PROJECTS": "Web App",
  "STRIPE / PAYMENT-INTEGRATED PLATFORMS": "Web App",
  "HEALTHCARE, MEDICAL & HIPAA SYSTEMS": "Web App",
  "IOT / HARDWARE-INTEGRATED PROJECTS": "Other",
  "AR / VR / 3D INTERACTIVE PROJECTS": "Creative/Motion",
  "MISCELLANEOUS / CORPORATE / MEDIA / LANDING PAGES / BLOGS": "Web App",
  "MOBILE APP": "Mobile App",
  "MOBILE APPS": "Mobile App",
};

const USE_CASE_HEADINGS = /^use\s*cases?\s*:?\s*$/i;
const TECH_STACK_HEADINGS =
  /^(tech\s*stack|technologies?)\s*:?\s*$/i;

type Section = "description" | "use_cases" | "tech_stack";

interface ParsedProject {
  name: string;
  url: string | null;
  description: string;
  use_cases: string | null;
  tech_stack: string | null;
  category: string;
}

interface PortfolioRow {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  use_cases: string | null;
  tech_stack: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- HTML → blocks ----------

interface Block {
  kind: "h1" | "h2" | "h3" | "p" | "li" | "table" | "other";
  text: string;
  raw: string;
  isBold: boolean;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTagsKeepUrl(raw: string): { text: string; url: string | null } {
  let url: string | null = null;
  const anchorRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(raw)) !== null) {
    if (!url) url = decodeEntities(match[1]);
  }
  const text = decodeEntities(raw.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  return { text, url };
}

function blockify(html: string): Block[] {
  const blocks: Block[] = [];
  const tagRegex =
    /<(h1|h2|h3|p|li|table)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    const kindRaw = match[1].toLowerCase() as Block["kind"];
    const inner = match[2];
    const kind: Block["kind"] = (
      ["h1", "h2", "h3", "p", "li", "table"] as const
    ).includes(kindRaw as "h1" | "h2" | "h3" | "p" | "li" | "table")
      ? kindRaw
      : "other";
    if (kind === "table") {
      // Extract table rows → each row one text line (right-hand column preference)
      const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
      const cells: string[] = [];
      let rMatch: RegExpExecArray | null;
      while ((rMatch = rowRegex.exec(inner)) !== null) {
        const cellTexts: string[] = [];
        const cellRegex = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi;
        let cMatch: RegExpExecArray | null;
        while ((cMatch = cellRegex.exec(rMatch[1])) !== null) {
          const { text } = stripTagsKeepUrl(cMatch[1]);
          if (text) cellTexts.push(text);
        }
        if (cellTexts.length > 0) {
          // prefer right-hand column
          cells.push(cellTexts[cellTexts.length - 1]);
        }
      }
      blocks.push({
        kind: "table",
        text: cells.join(", "),
        raw: inner,
        isBold: false,
      });
      continue;
    }
    const { text, url: innerUrl } = stripTagsKeepUrl(inner);
    if (!text && !innerUrl) continue;
    const isBold = /^<strong\b[^>]*>[\s\S]*<\/strong>\s*$/i.test(inner.trim());
    blocks.push({
      kind,
      text,
      raw: innerUrl ?? inner,
      isBold,
    });
  }
  return blocks;
}

// ---------- Helpers ----------

function stripEmoji(s: string): string {
  try {
    return s
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\uFE0F/g, "")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return s.trim();
  }
}

function normaliseCategoryText(s: string): string {
  return s.replace(/\s+/g, " ").trim().toUpperCase();
}

function extractCategory(text: string): string | null {
  const up = normaliseCategoryText(text);
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (up === normaliseCategoryText(key)) return CATEGORY_MAP[key];
  }
  return null;
}

function looksLikeCategoryHeading(block: Block): string | null {
  // In the actual HestaBit docx, category headings are emitted by mammoth as
  // plain <p> blocks (not styled headings). Match on text content regardless
  // of tag kind.
  return extractCategory(block.text);
}

function matchNumberedProject(
  text: string,
): { number: number; title: string } | null {
  const m = /^\s*(\d+)\s*[.)]\s+(.*\S)\s*$/.exec(text);
  if (!m) return null;
  return { number: parseInt(m[1], 10), title: m[2] };
}

function isUseCaseHeading(text: string): boolean {
  return USE_CASE_HEADINGS.test(text.trim());
}

function isTechStackHeading(text: string): boolean {
  return TECH_STACK_HEADINGS.test(text.trim());
}

function isUrlLine(text: string): string | null {
  const trimmed = text.trim();
  const urlRegex = /^(?:🔗\s*)?(https?:\/\/\S+)/;
  const m = urlRegex.exec(trimmed);
  return m ? m[1] : null;
}

// ---------- Parser state machine ----------

function parseBlocks(blocks: Block[]): ParsedProject[] {
  const projects: ParsedProject[] = [];
  let zone: 1 | 2 = 1;
  let currentCategory: string | null = null;
  let lastTopLevelNumber = 0;
  let currentProject: ParsedProject | null = null;
  let currentSection: Section = "description";
  const descBuf: string[] = [];
  const useBuf: string[] = [];
  const techBuf: string[] = [];

  const finalise = () => {
    if (!currentProject) return;
    currentProject.description = descBuf.join("\n").trim();
    currentProject.use_cases = useBuf.length > 0 ? useBuf.join("\n").trim() : null;
    currentProject.tech_stack =
      techBuf.length > 0 ? techBuf.join("\n").trim() : null;
    if (!currentProject.description) currentProject.description = "";
    projects.push(currentProject);
    currentProject = null;
    descBuf.length = 0;
    useBuf.length = 0;
    techBuf.length = 0;
    currentSection = "description";
  };

  const appendToSection = (value: string) => {
    if (!currentProject) return;
    if (currentSection === "description") descBuf.push(value);
    else if (currentSection === "use_cases") useBuf.push(value);
    else techBuf.push(value);
  };

  for (const block of blocks) {
    if (!block.text && block.kind !== "p") continue;

    const maybeCategory = looksLikeCategoryHeading(block);
    if (maybeCategory) {
      finalise();
      currentCategory = maybeCategory;
      lastTopLevelNumber = 0;
      zone = 2;
      continue;
    }
    if (zone === 1) continue;

    // Section sub-headings take priority so "Tech Stack" etc. are not mistaken
    // for content.
    if (currentProject && isUseCaseHeading(block.text)) {
      currentSection = "use_cases";
      continue;
    }
    if (currentProject && isTechStackHeading(block.text)) {
      currentSection = "tech_stack";
      continue;
    }

    const numbered = matchNumberedProject(block.text);
    if (numbered) {
      // In this docx, top-level projects are emitted as <h1>. Numbered items
      // inside <p>/<li> are sub-sections of the current project, not new
      // projects. This single structural signal replaces brittle counter
      // heuristics.
      const isTopLevel = block.kind === "h1";

      if (isTopLevel) {
        finalise();
        currentProject = {
          name: stripEmoji(numbered.title),
          url: null,
          description: "",
          use_cases: null,
          tech_stack: null,
          category: currentCategory ?? "Other",
        };
        lastTopLevelNumber = numbered.number;
        currentSection = "description";
        continue;
      }
      // Otherwise treat as a sub-section inside the current project
      appendToSection(block.text);
      continue;
    }

    if (!currentProject) continue;

    // First URL after the project name comes through as an <h2> with a
    // "🔗 https://..." prefix. Also accept a plain URL paragraph if no h2.
    if (
      !currentProject.url &&
      descBuf.length === 0 &&
      useBuf.length === 0 &&
      techBuf.length === 0
    ) {
      const url = isUrlLine(block.text);
      if (url && (block.kind === "h2" || block.kind === "p")) {
        currentProject.url = url;
        continue;
      }
    }

    // Collapse a bullet list block (kind 'li') into a single line
    if (block.kind === "li") {
      appendToSection(`- ${block.text}`);
      continue;
    }

    if (block.kind === "table") {
      // Mostly used for tech stacks → store as comma-separated
      if (currentSection === "tech_stack") {
        appendToSection(block.text);
      } else {
        appendToSection(block.text);
      }
      continue;
    }

    appendToSection(block.text);
  }
  finalise();

  // Post-process: tidy bullet lists in tech_stack → comma-separated readable
  for (const p of projects) {
    if (p.tech_stack) {
      const lines = p.tech_stack
        .split("\n")
        .map((l) => l.replace(/^[-•–]\s*/, "").trim())
        .filter((l) => l.length > 0);
      p.tech_stack = lines.join(", ");
    }
    if (p.use_cases) {
      const lines = p.use_cases.split("\n").map((l) => l.trim()).filter(Boolean);
      p.use_cases = lines.join("\n");
    }
    p.description = p.description.replace(/\s+\n/g, "\n").trim();
    p.name = p.name.replace(/\s+/g, " ").trim();
  }

  return projects;
}

// ---------- Summary helpers ----------

function categoryBreakdown(projects: ParsedProject[]): string {
  const counts = new Map<string, number>();
  for (const p of projects) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const lines: string[] = [];
  for (const [cat, count] of [...counts.entries()].sort()) {
    lines.push(`  ${cat.padEnd(16)} ${count}`);
  }
  lines.push(`  ${"TOTAL".padEnd(16)} ${projects.length}`);
  return lines.join("\n");
}

function formatPreview(projects: ParsedProject[], n: number): string {
  return projects
    .slice(0, n)
    .map((p, i) => {
      const url = p.url ? "url=present" : "url=none";
      return `  [${i + 1}] ${p.name}  (${p.category}, ${url})`;
    })
    .join("\n");
}

// ---------- Supabase helpers ----------

function buildServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check .env.local",
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function snapshotExisting(
  supabase: ReturnType<typeof buildServiceClient>,
): Promise<{ path: string; count: number }> {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`snapshot read failed: ${error.message}`);
  const rows = (data ?? []) as PortfolioRow[];
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join("scripts", "backups");
  await fs.mkdir(backupDir, { recursive: true });
  const filePath = path.join(backupDir, `portfolio-backup-${ts}.json`);
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
  return { path: filePath, count: rows.length };
}

async function waitForEnter(promptText: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  await new Promise<void>((resolve) => rl.question(promptText, () => resolve()));
  rl.close();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Main ----------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const docxArg = args.find((a) => !a.startsWith("--"));
  const docxPath = docxArg ?? DEFAULT_DOCX_PATH;

  console.log(`[ingest] reading docx: ${docxPath}`);
  const buffer = await fs.readFile(docxPath);
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const blocks = blockify(html);
  console.log(`[ingest] extracted ${blocks.length} blocks from HTML`);

  const projects = parseBlocks(blocks);
  console.log(`[ingest] parsed ${projects.length} projects`);
  console.log(`\n[ingest] first 5 projects for sanity check:`);
  console.log(formatPreview(projects, 5));
  console.log(`\n[ingest] category breakdown:`);
  console.log(categoryBreakdown(projects));

  if (dryRun) {
    console.log(`\n[ingest] --dry-run: writing parsed JSON to stdout`);
    console.log("=== BEGIN PARSED JSON ===");
    console.log(JSON.stringify(projects, null, 2));
    console.log("=== END PARSED JSON ===");
    console.log(`\n[ingest] dry-run complete. No DB writes.`);
    return;
  }

  if (projects.length === 0) {
    console.error("[ingest] ABORT: parsed 0 projects. Check the docx.");
    process.exit(1);
  }

  const supabase = buildServiceClient();

  console.log(`\n[ingest] snapshotting existing portfolio_items …`);
  const { path: backupPath, count: backupCount } = await snapshotExisting(supabase);
  console.log(`[ingest] backed up ${backupCount} rows → ${backupPath}`);

  await waitForEnter(
    `\n[ingest] About to DELETE all ${backupCount} existing portfolio_items and insert ${projects.length} records. Press Enter to continue, Ctrl+C to abort: `,
  );

  console.log(`\n[ingest] deleting existing rows …`);
  const { error: deleteErr } = await supabase
    .from("portfolio_items")
    .delete()
    .not("id", "is", null);
  if (deleteErr) {
    console.error("[ingest] DELETE failed:", deleteErr.message);
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;
  for (let i = 0; i < projects.length; i += 1) {
    const p = projects[i];
    try {
      const text = [p.name, p.description, p.use_cases ?? "", p.tech_stack ?? ""]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ");
      const embedding = await embedDocument(text);
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `embedding dims ${embedding.length} !== ${EMBEDDING_DIMENSIONS}`,
        );
      }
      const { error: insertErr } = await supabase.from("portfolio_items").insert({
        name: p.name,
        url: p.url,
        description: p.description || null,
        use_cases: p.use_cases,
        tech_stack: p.tech_stack,
        category: p.category,
        embedding,
      });
      if (insertErr) throw new Error(`insert failed: ${insertErr.message}`);
      inserted += 1;
      console.log(
        `[${String(i + 1).padStart(3)}/${projects.length}] inserted: ${p.name}`,
      );
    } catch (err) {
      skipped += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[${String(i + 1).padStart(3)}/${projects.length}] SKIPPED: ${p.name} — ${msg}`,
      );
    }
    await sleep(EMBED_THROTTLE_MS);
  }

  console.log(
    `\n[ingest] done. Inserted ${inserted}, skipped ${skipped}. Backup preserved at ${backupPath}.`,
  );
}

main().catch((err) => {
  console.error("[ingest] FATAL:", err);
  process.exit(1);
});
