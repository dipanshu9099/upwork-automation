"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PipelineRunner from "@/components/pipeline/PipelineRunner";
import type { FeedbackHistoryRow } from "./page";

const MAX_FEEDBACK_CHARS = 4000;
const DEPLOY_WAIT_SECONDS = 30;

interface AppliedChange {
  bot: string;
  reason: string;
}

interface SubmitResult {
  success: boolean;
  changes: AppliedChange[];
  skipped?: Array<{ bot: string; reason: string }>;
  explanation: string;
  snapshot_id: string | null;
  error?: string;
}

type SubmitStatus =
  | { phase: "idle" }
  | { phase: "analysing" }
  | { phase: "applying" }
  | { phase: "done"; result: SubmitResult }
  | { phase: "error"; message: string };

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

function previewFeedback(text: string, max = 90): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max)}…` : collapsed;
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "applied":
      return {
        label: "applied",
        className: "bg-green-100 text-green-800",
      };
    case "processing":
      return {
        label: "processing",
        className: "bg-blue-100 text-blue-800",
      };
    case "failed":
      return { label: "failed", className: "bg-red-100 text-red-800" };
    case "pending":
    default:
      return { label: status || "pending", className: "bg-gray-100 text-gray-700" };
  }
}

export default function FeedbackForm({
  initialHistory,
  loadError,
}: {
  initialHistory: FeedbackHistoryRow[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState("");
  const [status, setStatus] = useState<SubmitStatus>({ phase: "idle" });
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [deployCountdown, setDeployCountdown] = useState<number>(0);
  const [rollbackBusyId, setRollbackBusyId] = useState<string | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  function startDeployCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setDeployCountdown(DEPLOY_WAIT_SECONDS);
    countdownRef.current = setInterval(() => {
      setDeployCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const charsLeft = MAX_FEEDBACK_CHARS - feedbackText.length;
  const submitDisabled =
    feedbackText.trim().length === 0 ||
    feedbackText.length > MAX_FEEDBACK_CHARS ||
    status.phase === "analysing" ||
    status.phase === "applying";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInlineError(null);
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      setInlineError("Feedback is required.");
      return;
    }
    if (trimmed.length > MAX_FEEDBACK_CHARS) {
      setInlineError(`Feedback is too long (max ${MAX_FEEDBACK_CHARS} chars).`);
      return;
    }

    setStatus({ phase: "analysing" });
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_text: trimmed }),
      });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (!res.ok) {
        let errMsg = `Submit failed (${res.status}).`;
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error?: unknown }).error === "string"
        ) {
          errMsg = (body as { error: string }).error;
        }
        setStatus({ phase: "error", message: errMsg });
        return;
      }
      const result = body as SubmitResult;
      setStatus({ phase: "done", result });
      if (result.changes.length > 0 && result.snapshot_id) {
        startDeployCountdown();
      }
      // Refresh server-fetched history once the applied row lands
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[feedback/FeedbackForm] submit failed:", message);
      setStatus({ phase: "error", message });
    }
  }

  async function onRollback(snapshotId: string) {
    if (!snapshotId) return;
    const ok = window.confirm(
      "Roll back to this snapshot? This commits the older prompts and triggers a redeploy.",
    );
    if (!ok) return;
    setRollbackError(null);
    setRollbackBusyId(snapshotId);
    try {
      const res = await fetch("/api/feedback/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot_id: snapshotId }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setRollbackError(body.error ?? `Rollback failed (${res.status}).`);
        return;
      }
      startDeployCountdown();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[feedback/FeedbackForm] rollback failed:", message);
      setRollbackError(message);
    } finally {
      setRollbackBusyId(null);
    }
  }

  const submitButtonLabel =
    status.phase === "analysing"
      ? "Analysing feedback…"
      : status.phase === "applying"
        ? "Applying changes…"
        : "Analyse & Apply";

  const phaseNote =
    status.phase === "analysing"
      ? "Reading current prompts.ts from GitHub and asking Gemini what to change…"
      : status.phase === "applying"
        ? "Committing updated prompts to main…"
        : null;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="mt-1 text-sm text-gray-600">
          Describe what you want to change about proposal quality. Gemini will
          decide which bot prompts to update, snapshot the current state, and
          commit the change to <code>main</code>.
        </p>
      </header>

      {/* Panel 1 — Submit feedback */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Submit feedback</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="feedback-text"
              className="block text-sm font-medium text-gray-700"
            >
              What should change?
            </label>
            <textarea
              id="feedback-text"
              name="feedback_text"
              rows={6}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe what you want to improve… e.g. 'Make the hook more direct and shorter.'"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
              disabled={
                status.phase === "analysing" || status.phase === "applying"
              }
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>
                {charsLeft >= 0
                  ? `${charsLeft.toLocaleString()} chars left`
                  : `${(-charsLeft).toLocaleString()} over limit`}
              </span>
              {inlineError && <span className="text-red-600">{inlineError}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={submitDisabled}
            >
              {submitButtonLabel}
            </button>
            {phaseNote && (
              <span className="text-xs text-gray-500">{phaseNote}</span>
            )}
          </div>
        </form>

        {status.phase === "error" && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {status.message}
          </div>
        )}

        {status.phase === "done" && status.result.success && status.result.changes.length === 0 && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
            <p className="font-medium">No prompt changes needed.</p>
            {status.result.explanation && (
              <p className="mt-1 text-gray-700">{status.result.explanation}</p>
            )}
          </div>
        )}

        {status.phase === "done" && status.result.changes.length > 0 && (
          <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">
              Changes applied to {status.result.changes.length} bot
              {status.result.changes.length === 1 ? "" : "s"}:{" "}
              {status.result.changes.map((c) => c.bot).join(", ")}
            </p>
            {status.result.explanation && (
              <p className="mt-2 text-sm text-green-900">
                {status.result.explanation}
              </p>
            )}
            {status.result.skipped && status.result.skipped.length > 0 && (
              <p className="mt-2 text-xs text-green-900">
                Skipped: {status.result.skipped
                  .map((s) => `${s.bot} (${s.reason})`)
                  .join(", ")}
              </p>
            )}
            <p className="mt-3 text-xs text-green-900">
              Deployed to production — changes live in ~{deployCountdown > 0 ? `${deployCountdown}s` : "a moment"}.
            </p>
            {status.result.snapshot_id && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-green-900">
                  Snapshot: <code>{status.result.snapshot_id.slice(0, 8)}</code>
                </span>
                <button
                  type="button"
                  onClick={() => onRollback(status.result.snapshot_id as string)}
                  disabled={rollbackBusyId === status.result.snapshot_id}
                  className="rounded-md border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-100 disabled:opacity-50"
                >
                  {rollbackBusyId === status.result.snapshot_id
                    ? "Rolling back…"
                    : "Roll back this change"}
                </button>
              </div>
            )}
            {rollbackError && (
              <p className="mt-2 text-xs text-red-700">{rollbackError}</p>
            )}
          </div>
        )}

        {status.phase === "done" && !status.result.success && (
          <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            <p className="font-medium">
              {status.result.error ?? "No changes could be applied."}
            </p>
            {status.result.explanation && (
              <p className="mt-1">{status.result.explanation}</p>
            )}
          </div>
        )}
      </section>

      {/* Panel 2 — Test the updated prompts */}
      <section>
        <PipelineRunner
          heading="Test the updated prompts"
          subheading="Run a test proposal to verify the change before it goes to real buyers. Uses the same /api/pipeline endpoint as /chat."
          disabled={deployCountdown > 0}
          disabledMessage={
            deployCountdown > 0
              ? `Waiting for Vercel redeploy (~${deployCountdown}s)…`
              : null
          }
          submitLabel="Run test proposal"
          textareaLabel="Test job post"
          placeholder="Paste a sample job post here to test the updated prompts…"
        />
      </section>

      {/* Panel 3 — Change history */}
      <section>
        <h2 className="text-lg font-medium">Change history</h2>
        <p className="mt-1 text-xs text-gray-500">
          Last 20 feedback submissions, newest first.
        </p>
        {loadError ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {loadError}
          </div>
        ) : initialHistory.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No feedback yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Feedback
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    AI analysis
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    {/* action */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialHistory.map((row) => {
                  const badge = statusBadge(row.status);
                  const analysis = row.ai_analysis
                    ? previewFeedback(row.ai_analysis, 120)
                    : row.error
                      ? `Error: ${previewFeedback(row.error, 100)}`
                      : "—";
                  const canRollback =
                    row.status === "applied" && !!row.snapshot_id;
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {formatTimestamp(row.created_at)}
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        {previewFeedback(row.feedback_text, 60)}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {analysis}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {canRollback ? (
                          <button
                            type="button"
                            onClick={() =>
                              onRollback(row.snapshot_id as string)
                            }
                            disabled={rollbackBusyId === row.snapshot_id}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {rollbackBusyId === row.snapshot_id
                              ? "Rolling back…"
                              : "Roll back"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
