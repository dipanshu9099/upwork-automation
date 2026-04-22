import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_TEXT_MODEL = "gemini-2.5-pro";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("[gemini/generate] Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

export async function generateText(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
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
  return text;
}
