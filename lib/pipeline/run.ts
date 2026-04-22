import { generateText } from "@/lib/gemini/generate";
import { retrievePortfolioFacts } from "@/lib/gemini/retrieve";
import { createServiceClient } from "@/lib/supabase/service";
import { BOTS } from "./prompts";
import type { PipelineEvent, PipelineState } from "./types";

const PIPELINE_INCOMPLETE_MARKER =
  "(Pipeline incomplete — no proposal generated)";

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

  for (const bot of BOTS) {
    try {
      const userPrompt = bot.buildUserPrompt(state);
      const output = await generateText({
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
