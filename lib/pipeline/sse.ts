import type { PipelineEvent } from "./types";

const encoder = new TextEncoder();

export function encodeSse(event: string, data: unknown): Uint8Array {
  const payload = JSON.stringify(data);
  return encoder.encode(`event: ${event}\ndata: ${payload}\n\n`);
}

export function encodePipelineEvent(event: PipelineEvent): Uint8Array {
  switch (event.type) {
    case "retrieval":
      return encodeSse("retrieval", { content: event.content });
    case "bot":
      return encodeSse("bot", {
        id: event.id,
        label: event.label,
        content: event.content,
      });
    case "bot-error":
      return encodeSse("bot-error", {
        id: event.id,
        label: event.label,
        error: event.error,
      });
    case "pipeline-error":
      return encodeSse("pipeline-error", { error: event.error });
    case "done":
      return encodeSse("done", { proposalId: event.proposalId });
  }
}
