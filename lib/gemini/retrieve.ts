import { createServiceClient } from "@/lib/supabase/service";
import { embedQuery } from "./embed";

const EMPTY_FALLBACK =
  "No portfolio items available in the database yet. Lean on the technical analysis instead.";

const MATCH_COUNT = 5;

type MatchRow = {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  use_cases: string | null;
  tech_stack: string | null;
  category: string | null;
  similarity: number;
};

function formatRows(rows: MatchRow[]): string {
  if (rows.length === 0) return EMPTY_FALLBACK;
  return rows
    .map((r, i) => {
      const sim = r.similarity.toFixed(2);
      const url = r.url && r.url.trim().length > 0 ? r.url : "none";
      return [
        `--- Portfolio Item ${i + 1}: ${r.name} (similarity: ${sim}, category: ${r.category ?? "Other"}) ---`,
        `URL: ${url}`,
        `Description: ${r.description ?? ""}`,
        `Use cases: ${r.use_cases ?? ""}`,
        `Tech stack: ${r.tech_stack ?? ""}`,
      ].join("\n");
    })
    .join("\n\n");
}

export async function retrievePortfolioFacts(jobText: string): Promise<string> {
  try {
    const queryEmbedding = await embedQuery(jobText);
    const service = createServiceClient();
    const { data, error } = await service.rpc("match_portfolio", {
      query_embedding: queryEmbedding,
      match_count: MATCH_COUNT,
    });
    if (error) {
      console.error("[gemini/retrieve] match_portfolio rpc failed:", error);
      return EMPTY_FALLBACK;
    }
    const rows = (data ?? []) as MatchRow[];
    return formatRows(rows);
  } catch (err) {
    console.error("[gemini/retrieve] unexpected error:", err);
    return EMPTY_FALLBACK;
  }
}
