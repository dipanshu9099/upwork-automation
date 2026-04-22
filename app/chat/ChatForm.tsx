"use client";

import { useCallback, useRef, useState } from "react";

type BotCard =
  | { status: "running"; id: string; label: string }
  | { status: "done"; id: string; label: string; content: string }
  | { status: "error"; id: string; label: string; error: string };

type UiState = {
  cards: BotCard[];
  portfolioFacts: string | null;
  finalProposalId: string | null;
  pipelineError: string | null;
  running: boolean;
};

const BOT_ORDER: Array<{ id: string; label: string }> = [
  { id: "persona", label: "Persona Bot" },
  { id: "technical", label: "Technical Bot" },
  { id: "portfolio", label: "Portfolio Facts Bot" },
  { id: "productdev", label: "Product Dev Bot" },
  { id: "micro", label: "Micro-Methodology Bot" },
  { id: "salespsych", label: "Sales Psychology Bot" },
  { id: "bidwriter", label: "Bid-Writing Bot" },
  { id: "formatter", label: "Content Formatting Bot" },
];

const MAX_JOB_INPUT_CHARS = 12_000;

export default function ChatForm() {
  const [jobInput, setJobInput] = useState("");
  const [ui, setUi] = useState<UiState>({
    cards: [],
    portfolioFacts: null,
    finalProposalId: null,
    pipelineError: null,
    running: false,
  });
  const [clientError, setClientError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const resetState = () => {
    setUi({
      cards: [],
      portfolioFacts: null,
      finalProposalId: null,
      pipelineError: null,
      running: false,
    });
    setClientError(null);
    setCopied(false);
  };

  const runPipeline = useCallback(async () => {
    const trimmed = jobInput.trim();
    if (!trimmed) {
      setClientError("Paste an Upwork job post first.");
      return;
    }
    if (trimmed.length > MAX_JOB_INPUT_CHARS) {
      setClientError(`Job post is too long (max ${MAX_JOB_INPUT_CHARS} chars).`);
      return;
    }

    setClientError(null);
    setCopied(false);
    setUi({
      cards: BOT_ORDER.slice(0, 1).map((b) => ({
        status: "running",
        id: b.id,
        label: b.label,
      })),
      portfolioFacts: null,
      finalProposalId: null,
      pipelineError: null,
      running: true,
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobInput: trimmed }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Pipeline request failed (${res.status}): ${text || res.statusText}`,
        );
      }
      await readEventStream(res.body.getReader(), (event) => {
        setUi((prev) => applyEvent(prev, event));
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[chat/ChatForm] pipeline error:", message);
      setUi((prev) => ({ ...prev, running: false, pipelineError: message }));
    } finally {
      abortRef.current = null;
    }
  }, [jobInput]);

  const cancel = () => {
    abortRef.current?.abort();
    setUi((prev) => ({ ...prev, running: false }));
  };

  const startNew = () => {
    resetState();
    setJobInput("");
  };

  const finalCard = ui.cards.find((c) => c.id === "formatter" && c.status === "done");

  const copyFinal = async () => {
    if (!finalCard || finalCard.status !== "done") return;
    try {
      await navigator.clipboard.writeText(finalCard.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("[chat/ChatForm] clipboard write failed:", err);
    }
  };

  const charsLeft = MAX_JOB_INPUT_CHARS - jobInput.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">New proposal</h1>
      <p className="mt-1 text-sm text-gray-600">
        Paste the Upwork job post. The 8-bot pipeline will stream each bot&apos;s output as it completes.
      </p>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="jobInput" className="block text-sm font-medium text-gray-700">
          Upwork job post
        </label>
        <textarea
          id="jobInput"
          name="jobInput"
          rows={10}
          value={jobInput}
          onChange={(e) => setJobInput(e.target.value)}
          disabled={ui.running}
          placeholder="Paste the Upwork job post here..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span>{charsLeft >= 0 ? `${charsLeft.toLocaleString()} chars left` : `${(-charsLeft).toLocaleString()} over limit`}</span>
          {clientError && <span className="text-red-600">{clientError}</span>}
        </div>

        <div className="mt-4 flex items-center gap-3">
          {!ui.running ? (
            <button
              type="button"
              onClick={runPipeline}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={jobInput.trim().length === 0}
            >
              Generate proposal
            </button>
          ) : (
            <button
              type="button"
              onClick={cancel}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {(ui.cards.length > 0 || ui.finalProposalId || ui.pipelineError) &&
            !ui.running && (
              <button
                type="button"
                onClick={startNew}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                New proposal
              </button>
            )}
        </div>
      </section>

      {ui.pipelineError && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Pipeline error: {ui.pipelineError}
        </div>
      )}

      <section className="mt-8 space-y-4">
        {ui.cards.map((card) => {
          const isFinal = card.id === "formatter";
          return (
            <article
              key={card.id}
              className={`rounded-lg border bg-white p-5 shadow-sm ${
                isFinal && card.status === "done"
                  ? "border-green-400 ring-1 ring-green-200"
                  : "border-gray-200"
              }`}
            >
              <header className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {isFinal && card.status === "done" ? "Your proposal" : card.label}
                </h2>
                <span
                  className={`text-xs ${
                    card.status === "running"
                      ? "text-gray-500"
                      : card.status === "error"
                        ? "text-red-600"
                        : "text-green-700"
                  }`}
                >
                  {card.status === "running"
                    ? `Running ${card.label}…`
                    : card.status === "error"
                      ? "Failed"
                      : "Done"}
                </span>
              </header>
              {card.status === "done" && (
                <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-gray-800">
                  {card.content}
                </pre>
              )}
              {card.status === "error" && (
                <p className="mt-3 text-sm text-red-700">{card.error}</p>
              )}
              {isFinal && card.status === "done" && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={copyFinal}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function applyEvent(
  prev: UiState,
  event: { type: string; payload: Record<string, unknown> },
): UiState {
  switch (event.type) {
    case "retrieval":
      return { ...prev, portfolioFacts: String(event.payload.content ?? "") };
    case "bot": {
      const id = String(event.payload.id ?? "");
      const label = String(event.payload.label ?? "");
      const content = String(event.payload.content ?? "");
      const existingIdx = prev.cards.findIndex((c) => c.id === id);
      const doneCard: BotCard = { status: "done", id, label, content };
      const cards =
        existingIdx >= 0
          ? prev.cards.map((c, i) => (i === existingIdx ? doneCard : c))
          : [...prev.cards, doneCard];

      const nextBotIdx = BOT_ORDER.findIndex((b) => b.id === id) + 1;
      const nextBot = BOT_ORDER[nextBotIdx];
      if (nextBot && !cards.some((c) => c.id === nextBot.id)) {
        cards.push({ status: "running", id: nextBot.id, label: nextBot.label });
      }
      return { ...prev, cards };
    }
    case "bot-error": {
      const id = String(event.payload.id ?? "");
      const label = String(event.payload.label ?? "");
      const error = String(event.payload.error ?? "Unknown error");
      const existingIdx = prev.cards.findIndex((c) => c.id === id);
      const errorCard: BotCard = { status: "error", id, label, error };
      const cards =
        existingIdx >= 0
          ? prev.cards.map((c, i) => (i === existingIdx ? errorCard : c))
          : [...prev.cards, errorCard];

      const nextBotIdx = BOT_ORDER.findIndex((b) => b.id === id) + 1;
      const nextBot = BOT_ORDER[nextBotIdx];
      if (nextBot && !cards.some((c) => c.id === nextBot.id)) {
        cards.push({ status: "running", id: nextBot.id, label: nextBot.label });
      }
      return { ...prev, cards };
    }
    case "pipeline-error":
      return {
        ...prev,
        pipelineError: String(event.payload.error ?? "Unknown pipeline error"),
      };
    case "done": {
      const proposalIdRaw = event.payload.proposalId;
      return {
        ...prev,
        running: false,
        finalProposalId:
          typeof proposalIdRaw === "string" ? proposalIdRaw : null,
      };
    }
    default:
      return prev;
  }
}

async function readEventStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: { type: string; payload: Record<string, unknown> }) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseSseEvent(raw);
      if (parsed) onEvent(parsed);
      boundary = buffer.indexOf("\n\n");
    }
  }
  if (buffer.trim().length > 0) {
    const parsed = parseSseEvent(buffer);
    if (parsed) onEvent(parsed);
  }
}

function parseSseEvent(
  raw: string,
): { type: string; payload: Record<string, unknown> } | null {
  const lines = raw.split("\n");
  let type: string | null = null;
  let dataStr = "";
  for (const line of lines) {
    if (line.startsWith("event:")) {
      type = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataStr += (dataStr ? "\n" : "") + line.slice(5).trim();
    }
  }
  if (!type || !dataStr) return null;
  try {
    const payload = JSON.parse(dataStr) as Record<string, unknown>;
    return { type, payload };
  } catch (err) {
    console.warn("[chat/parseSseEvent] malformed data:", err, dataStr);
    return null;
  }
}
