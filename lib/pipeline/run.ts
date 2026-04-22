import { generateText } from "@/lib/gemini/generate";
import { retrievePortfolioFacts } from "@/lib/gemini/retrieve";
import { createServiceClient } from "@/lib/supabase/service";
import { BOTS } from "./prompts";
import type { PipelineEvent, PipelineState } from "./types";

const PIPELINE_INCOMPLETE_MARKER =
  "(Pipeline incomplete — no proposal generated)";

// Gemini 2.5 Pro pricing as of April 2026 (prompts <= 200k):
// input $1.25 / 1M, output $10.00 / 1M
const INPUT_PRICE_PER_M = 1.25;
const OUTPUT_PRICE_PER_M = 10.0;

export async function runPipeline(args: {
  userId: string;
  jobInput: string;
  emit: (event: PipelineEvent) => void;
}): Promise<void> {
  const { userId, jobInput, emit } = args;

  const portfolioFacts = await retrievePortfolioFacts(jobInput);
  emit({ type: "retrieval", content: portfolioFacts });

  const state: PipelineState = {
    jobInput,
    portfolioFacts,
  };

  let totalPromptTokens = 0;
  let totalCandidatesTokens = 0;
  let totalTokens = 0;
  let sawAnyUsage = false;

  for (const bot of BOTS) {
    try {
      const userPrompt = bot.buildUserPrompt(state);
      const { text: output, usage } = await generateText({
        systemPrompt: bot.systemPrompt,
        userPrompt,
      });
      state[bot.stateKey] = output;
      emit({
        type: "bot",
        id: bot.id,
        label: bot.label,
        content: output,
      });

      try {
        if (usage) {
          const prompt = usage.promptTokens ?? 0;
          const candidates = usage.candidatesTokens ?? 0;
          const total = usage.totalTokens ?? prompt + candidates;
          totalPromptTokens += prompt;
          totalCandidatesTokens += candidates;
          totalTokens += total;
          sawAnyUsage = true;
          console.log(
            `[pipeline] ${bot.id} | promptTokens: ${prompt} | candidatesTokens: ${candidates} | totalTokens: ${total}`,
          );
        } else {
          console.log(`[pipeline] ${bot.id} | cost data unavailable`);
        }
      } catch (costErr) {
        console.warn(`[pipeline] ${bot.id} cost logging failed:`, costErr);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[pipeline/run] bot ${bot.id} failed:`,
        message,
        err instanceof Error ? err.stack : undefined,
      );
      state[bot.stateKey] = "";
      emit({
        type: "bot-error",
        id: bot.id,
        label: bot.label,
        error: message,
      });
    }
  }

  try {
    if (sawAnyUsage) {
      const cost =
        (totalPromptTokens / 1_000_000) * INPUT_PRICE_PER_M +
        (totalCandidatesTokens / 1_000_000) * OUTPUT_PRICE_PER_M;
      console.log(
        `[pipeline] TOTAL | promptTokens: ${totalPromptTokens} | candidatesTokens: ${totalCandidatesTokens} | totalTokens: ${totalTokens} | estimatedCost: $${cost.toFixed(3)}`,
      );
    } else {
      console.log("[pipeline] cost data unavailable");
    }
  } catch (costErr) {
    console.warn("[pipeline] TOTAL cost logging failed:", costErr);
  }

  const proposalOutput =
    (state.outputFormatted && state.outputFormatted.trim().length > 0
      ? state.outputFormatted
      : undefined) ??
    (state.outputBidWriter && state.outputBidWriter.trim().length > 0
      ? state.outputBidWriter
      : undefined) ??
    PIPELINE_INCOMPLETE_MARKER;

  let proposalId: string | null = null;
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("proposals")
      .insert({
        user_id: userId,
        job_input: jobInput,
        proposal_output: proposalOutput,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[pipeline/run] proposals insert failed:", error);
    } else {
      proposalId = data.id;
    }
  } catch (err) {
    console.error("[pipeline/run] proposals insert threw:", err);
  }

  emit({ type: "done", proposalId });
}
