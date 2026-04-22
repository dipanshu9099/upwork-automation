export interface PipelineState {
  jobInput: string;
  portfolioFacts: string;
  outputPersona?: string;
  outputTechnical?: string;
  outputPortfolio?: string;
  outputProductDev?: string;
  outputMicro?: string;
  outputSalesPsych?: string;
  outputBidWriter?: string;
  outputFormatted?: string;
}

export type BotOutputKey =
  | "outputPersona"
  | "outputTechnical"
  | "outputPortfolio"
  | "outputProductDev"
  | "outputMicro"
  | "outputSalesPsych"
  | "outputBidWriter"
  | "outputFormatted";

export interface BotConfig {
  id: BotId;
  label: string;
  systemPrompt: string;
  buildUserPrompt: (state: PipelineState) => string;
  stateKey: BotOutputKey;
}

export type BotId =
  | "persona"
  | "technical"
  | "portfolio"
  | "productdev"
  | "micro"
  | "salespsych"
  | "bidwriter"
  | "formatter";

export type PipelineEvent =
  | { type: "retrieval"; content: string }
  | { type: "bot"; id: BotId; label: string; content: string }
  | { type: "bot-error"; id: BotId; label: string; error: string }
  | { type: "pipeline-error"; error: string }
  | { type: "done"; proposalId: string | null };
