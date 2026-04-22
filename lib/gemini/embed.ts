import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("[gemini/embed] Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

export async function embedDocument(text: string): Promise<number[]> {
  const model = getClient().getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return result.embedding.values;
}

export async function embedQuery(text: string): Promise<number[]> {
  const model = getClient().getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return result.embedding.values;
}
