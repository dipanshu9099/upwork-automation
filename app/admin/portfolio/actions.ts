"use server";

import { revalidatePath } from "next/cache";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { embedDocument, EMBEDDING_DIMENSIONS } from "@/lib/gemini/embed";
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from "./constants";

type ActionResult = { ok: true; id: string } | { ok: false; error: string };

function toEmbeddingText(input: {
  name: string;
  description: string;
  use_cases: string;
  tech_stack: string;
}): string {
  return [input.name, input.description, input.use_cases, input.tech_stack]
    .filter((part) => part && part.trim().length > 0)
    .join(" ")
    .trim();
}

export async function addPortfolioItem(formData: FormData): Promise<ActionResult> {
  let stage = "init";
  try {
    stage = "auth";
    const userSupabase = createUserClient();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };

    stage = "parse-form";
    const name = String(formData.get("name") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const use_cases = String(formData.get("use_cases") ?? "").trim();
    const tech_stack = String(formData.get("tech_stack") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();

    if (!name) return { ok: false, error: "Name is required." };
    if (!description && !use_cases && !tech_stack) {
      return {
        ok: false,
        error: "Provide at least a description, use cases, or tech stack.",
      };
    }
    if (!PORTFOLIO_CATEGORIES.includes(category as PortfolioCategory)) {
      return { ok: false, error: "Invalid category." };
    }

    stage = "embed";
    const embeddingText = toEmbeddingText({ name, description, use_cases, tech_stack });
    console.log("[admin/portfolio] embedding text length:", embeddingText.length);
    const embedding = await embedDocument(embeddingText);
    console.log("[admin/portfolio] embedding ok, dims:", embedding.length);
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      console.error(
        "[admin/portfolio] unexpected embedding length",
        embedding.length,
        "expected",
        EMBEDDING_DIMENSIONS,
      );
      return { ok: false, error: "Embedding had unexpected dimensions." };
    }

    stage = "service-client";
    const service = createServiceClient();

    stage = "dup-lookup";
    const { data: existing, error: lookupErr } = await service
      .from("portfolio_items")
      .select("id")
      .ilike("name", name)
      .maybeSingle();
    if (lookupErr) {
      console.error("[admin/portfolio] duplicate-name lookup failed:", lookupErr);
      return { ok: false, error: "Could not check for existing item." };
    }

    const row = {
      name,
      url: url || null,
      description: description || null,
      use_cases: use_cases || null,
      tech_stack: tech_stack || null,
      category,
      embedding,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      stage = "update";
      const { error: updateErr } = await service
        .from("portfolio_items")
        .update(row)
        .eq("id", existing.id);
      if (updateErr) {
        console.error("[admin/portfolio] update failed:", updateErr);
        return { ok: false, error: "Save failed. See server logs." };
      }
      revalidatePath("/admin/portfolio");
      return { ok: true, id: existing.id };
    }

    stage = "insert";
    const { data: inserted, error: insertErr } = await service
      .from("portfolio_items")
      .insert(row)
      .select("id")
      .single();
    if (insertErr) {
      console.error("[admin/portfolio] insert failed:", insertErr);
      return { ok: false, error: "Save failed. See server logs." };
    }

    revalidatePath("/admin/portfolio");
    return { ok: true, id: inserted.id };
  } catch (err) {
    const e = err as Error & { cause?: unknown; response?: unknown };
    console.error(
      "[admin/portfolio] UNEXPECTED ERROR at stage:",
      stage,
      "| message:",
      e?.message,
      "| name:",
      e?.name,
      "| stack:",
      e?.stack,
      "| cause:",
      e?.cause,
    );
    return { ok: false, error: `Unexpected error at ${stage}. See server logs.` };
  }
}
