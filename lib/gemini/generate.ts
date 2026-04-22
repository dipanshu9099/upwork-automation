import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_TEXT_MODEL = "gemini-2.5-pro";

export interface GeminiUsage {
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  usage: GeminiUsage | null;
}

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("[gemini/generate] Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

export async function generateText(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<GenerateTextResult> {
  const model = getClient().getGenerativeModel({
    model: GEMINI_TEXT_MODEL,
    systemInstruction: args.systemPrompt,
  });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: args.userPrompt }] }],
  });
  const text = result.response.text();
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("[gemini/generate] empty response from Gemini");
  }

  let usage: GeminiUsage | null = null;
  try {
    const meta = result.response.usageMetadata;
    if (meta) {
      usage = {
        promptTokens: meta.promptTokenCount,
        candidatesTokens: meta.candidatesTokenCount,
        totalTokens: meta.totalTokenCount,
      };
    }
  } catch {
    usage = null;
  }

  return { text, usage };
}
