/**
 * Debug tool for the portfolio re-ingest pipeline.
 *
 * Dumps tag frequencies + the first 150 blocks (tag | text preview) of the
 * portfolio docx so a future parser regression can be diagnosed without
 * rediscovering mammoth's output shape from scratch.
 *
 *   tsx scripts/inspect-docx.ts [path/to/file.docx]
 *
 * Defaults to source-materials/HestaBit-Portfolio.docx.
 */
import { promises as fs } from "node:fs";
import mammoth from "mammoth";

async function main() {
  const docxPath = process.argv[2] ?? "source-materials/HestaBit-Portfolio.docx";
  const buffer = await fs.readFile(docxPath);
  const { value: html } = await mammoth.convertToHtml({ buffer });

  console.log(`HTML length: ${html.length}`);

  // Count tag frequencies
  const tagCount = new Map<string, number>();
  const tagRegex = /<(\w+)(?:\s[^>]*)?>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
  }
  console.log("\nTag frequencies:");
  for (const [tag, n] of [...tagCount.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tag}: ${n}`);
  }

  // Print first 120 blocks as (tag, first 100 chars text)
  const blockRegex = /<(h1|h2|h3|p|li|table)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let i = 0;
  let bMatch: RegExpExecArray | null;
  console.log("\nFirst 150 blocks (tag | text preview):");
  while ((bMatch = blockRegex.exec(html)) !== null && i < 150) {
    const tag = bMatch[1];
    const inner = bMatch[2];
    const isBold = /^<strong\b/.test(inner.trim());
    const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const preview = text.slice(0, 110);
    console.log(
      `  [${String(i).padStart(3)}] ${tag.padEnd(3)}${isBold ? "*" : " "}| ${preview}`,
    );
    i += 1;
  }

  // Grep for lines containing "PROJECTS" / "APPS" / "PLATFORMS" to find category headings
  console.log("\nLines containing likely category heading keywords:");
  const plain = html.replace(/<[^>]+>/g, "\n").split(/\n+/);
  for (const line of plain) {
    const trimmed = line.trim();
    if (/\b(PROJECTS|APPS|PLATFORMS|EXTENSIONS|BOTS|SYSTEMS|BLOGS)\b/.test(trimmed)) {
      console.log(`  ${JSON.stringify(trimmed).slice(0, 160)}`);
    }
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
