import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("[gemini/embed] Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

function serializeErr(err: unknown): string {
  try {
    if (err instanceof Error) {
      const plain: Record<string, unknown> = {};
      for (const k of Object.getOwnPropertyNames(err)) {
        plain[k] = (err as unknown as Record<string, unknown>)[k];
      }
      return JSON.stringify(plain);
    }
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function runEmbed(text: string, taskType: TaskType): Promise<number[]> {
  const keyPresent = !!process.env.GEMINI_API_KEY;
  const keyPrefix = (process.env.GEMINI_API_KEY ?? "").slice(0, 6);
  console.log(
    "[gemini/embed] about to call embedContent",
    JSON.stringify({
      model: EMBEDDING_MODEL,
      taskType,
      textLen: text.length,
      textPreview: text.slice(0, 80),
      keyPresent,
      keyPrefix,
    }),
  );
  const model = getClient().getGenerativeModel({ model: EMBEDDING_MODEL });
  try {
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text }] },
      taskType,
    });
    console.log(
      "[gemini/embed] embedContent returned, dims:",
      result.embedding.values.length,
    );
    return result.embedding.values;
  } catch (err) {
    console.error(
      "[gemini/embed] embedContent threw, raw:",
      serializeErr(err),
    );
    throw err;
  }
}

export async function embedDocument(text: string): Promise<number[]> {
  return runEmbed(text, TaskType.RETRIEVAL_DOCUMENT);
}

export async function embedQuery(text: string): Promise<number[]> {
  return runEmbed(text, TaskType.RETRIEVAL_QUERY);
}
