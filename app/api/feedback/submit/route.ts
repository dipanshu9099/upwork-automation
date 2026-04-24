import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateText } from "@/lib/gemini/generate";
import { commitFile, getFile } from "@/lib/github";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPTS_PATH = "lib/pipeline/prompts.ts";
const MAX_FEEDBACK_CHARS = 4000;
const MAX_CHANGES = 3;

const REQUIRED_ENV = [
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GITHUB_TOKEN",
  "GITHUB_REPO_OWNER",
  "GITHUB_REPO_NAME",
];

interface ProposedChange {
  bot: string;
  reason: string;
  old: string;
  new: string;
}

interface AiResponse {
  explanation: string;
  changes: ProposedChange[];
}

const ANALYSIS_SYSTEM =
  "You are an expert Upwork proposal prompt engineer. You follow instructions exactly and return only valid JSON when asked.";

function buildAnalysisPrompt(promptsContent: string, feedbackText: string) {
  return `You are an expert Upwork proposal prompt engineer. You have access to the current prompts for an 8-bot proposal generation pipeline. A user has provided feedback about proposal quality. Your job is to decide which bot prompts need changing and exactly how to change them.

## Current prompts.ts content:
${promptsContent}

## User feedback:
${feedbackText}

## Your task:
1. Analyse the feedback carefully. Map it to specific bots (persona, technical, portfolio, productdev, micro, salespsych, bidwriter, formatter).
2. Decide the minimal set of prompt changes that would address the feedback.
3. For each change, produce the exact old string and exact new string so a find-and-replace can be applied safely.

## Rules:
- Only change what the feedback specifically implies. Do not refactor unrelated parts.
- Preserve all existing formatting, indentation, and TypeScript syntax exactly.
- Never remove existing rules — only add to or tighten them.
- If the feedback is vague or does not map to a specific prompt change, return an empty changes array and explain why.
- Maximum ${MAX_CHANGES} changes per feedback submission.

## Response format (JSON only, no prose outside the JSON):
{
  "explanation": "One paragraph explaining what you decided to change and why.",
  "changes": [
    {
      "bot": "bidwriter",
      "reason": "One sentence why this bot needs changing for this feedback.",
      "old": "exact string currently in prompts.ts",
      "new": "exact replacement string"
    }
  ]
}

If no changes are needed:
{
  "explanation": "Why no changes are needed.",
  "changes": []
}`;
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const fence = /^```(?:json|JSON)?\s*\n?([\s\S]*?)\n?```\s*$/;
  const m = fence.exec(trimmed);
  return (m ? m[1] : trimmed).trim();
}

function safeParseChanges(raw: string):
  | { ok: true; value: AiResponse }
  | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(stripFences(raw)) as Partial<AiResponse>;
    const changes = Array.isArray(parsed.changes) ? parsed.changes : [];
    const normalised: ProposedChange[] = [];
    for (const c of changes) {
      if (
        c &&
        typeof c === "object" &&
        typeof (c as ProposedChange).bot === "string" &&
        typeof (c as ProposedChange).old === "string" &&
        typeof (c as ProposedChange).new === "string"
      ) {
        normalised.push({
          bot: (c as ProposedChange).bot,
          reason:
            typeof (c as ProposedChange).reason === "string"
              ? (c as ProposedChange).reason
              : "",
          old: (c as ProposedChange).old,
          new: (c as ProposedChange).new,
        });
      }
    }
    return {
      ok: true,
      value: {
        explanation:
          typeof parsed.explanation === "string" ? parsed.explanation : "",
        changes: normalised,
      },
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function truncate(s: string, n: number): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length > n ? `${oneLine.slice(0, n)}…` : oneLine;
}

export async function POST(request: Request) {
  // Env gate — same pattern as /api/pipeline
  try {
    for (const k of REQUIRED_ENV) requireEnv(k);
  } catch (err) {
    console.error("[api/feedback/submit] env validation failed:", err);
    return NextResponse.json(
      { error: "Server misconfiguration. Contact admin." },
      { status: 500 },
    );
  }

  // Auth
  let caller;
  try {
    const userClient = createUserClient();
    const { data } = await userClient.auth.getUser();
    caller = data.user;
  } catch (err) {
    console.error("[api/feedback/submit] auth lookup failed:", err);
    return NextResponse.json({ error: "Auth failure." }, { status: 500 });
  }
  if (!caller) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Body
  let feedbackText: string;
  try {
    const body = (await request.json()) as { feedback_text?: unknown };
    feedbackText =
      typeof body.feedback_text === "string" ? body.feedback_text.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!feedbackText) {
    return NextResponse.json(
      { error: "feedback_text is required." },
      { status: 400 },
    );
  }
  if (feedbackText.length > MAX_FEEDBACK_CHARS) {
    return NextResponse.json(
      { error: `feedback_text exceeds ${MAX_FEEDBACK_CHARS} characters.` },
      { status: 413 },
    );
  }

  const service = createServiceClient();

  // Create pending feedback row up front so every downstream failure can
  // record itself back to the DB.
  const { data: feedbackRow, error: insertErr } = await service
    .from("feedback")
    .insert({
      user_id: caller.id,
      feedback_text: feedbackText,
      status: "processing",
    })
    .select("id")
    .single();
  if (insertErr || !feedbackRow) {
    console.error("[api/feedback/submit] insert feedback failed:", insertErr);
    return NextResponse.json(
      { error: "Could not record feedback." },
      { status: 500 },
    );
  }
  const feedbackId = feedbackRow.id as string;

  const markFailed = async (errorMsg: string, aiAnalysis?: string) => {
    try {
      await service
        .from("feedback")
        .update({
          status: "failed",
          error: errorMsg,
          ...(aiAnalysis ? { ai_analysis: aiAnalysis } : {}),
        })
        .eq("id", feedbackId);
    } catch (updErr) {
      console.error("[api/feedback/submit] markFailed fallback error:", updErr);
    }
  };

  try {
    // Fetch current prompts.ts from GitHub — source of truth (not local disk)
    const file = await getFile(PROMPTS_PATH);

    // Ask Gemini what to change
    const { text: rawResponse } = await generateText({
      systemPrompt: ANALYSIS_SYSTEM,
      userPrompt: buildAnalysisPrompt(file.content, feedbackText),
    });

    const parsed = safeParseChanges(rawResponse);
    if (!parsed.ok) {
      console.error(
        "[api/feedback/submit] Gemini JSON parse failed:",
        parsed.error,
        rawResponse.slice(0, 500),
      );
      await markFailed(`Gemini returned malformed JSON: ${parsed.error}`);
      return NextResponse.json(
        { error: "AI response could not be parsed." },
        { status: 502 },
      );
    }

    const ai = parsed.value;
    const proposed = ai.changes.slice(0, MAX_CHANGES);

    // No changes proposed → mark applied with the AI's explanation
    if (proposed.length === 0) {
      await service
        .from("feedback")
        .update({
          status: "applied",
          ai_analysis: ai.explanation || "No prompt changes needed.",
        })
        .eq("id", feedbackId);
      console.log(
        `[api/feedback/submit] caller=${caller.email} no-op — ${truncate(ai.explanation, 120)}`,
      );
      return NextResponse.json({
        success: true,
        changes: [],
        skipped: [],
        explanation: ai.explanation,
        snapshot_id: null,
      });
    }

    // Apply changes in-memory
    let updatedContent = file.content;
    const applied: ProposedChange[] = [];
    const skipped: Array<{ bot: string; reason: string }> = [];
    for (const change of proposed) {
      if (!change.old || !updatedContent.includes(change.old)) {
        skipped.push({
          bot: change.bot || "unknown",
          reason: "old string not found",
        });
        continue;
      }
      updatedContent = updatedContent.replace(change.old, change.new);
      applied.push(change);
    }

    if (applied.length === 0) {
      const note = `${ai.explanation}\n[skipped: ${skipped
        .map((s) => `bot=${s.bot} ${s.reason}`)
        .join(", ")}]`;
      await markFailed("no applicable changes — all old strings mismatched", note);
      return NextResponse.json(
        {
          success: false,
          changes: [],
          skipped,
          explanation: ai.explanation,
          error: "No applicable changes — the AI's 'old' strings did not match the current prompts.",
        },
        { status: 200 },
      );
    }

    // Snapshot the PRE-change content so rollback can restore it
    const { data: snapRow, error: snapErr } = await service
      .from("prompt_snapshots")
      .insert({
        triggered_by: feedbackText,
        content: file.content,
        is_active: false,
      })
      .select("id")
      .single();
    if (snapErr || !snapRow) {
      console.error("[api/feedback/submit] snapshot insert failed:", snapErr);
      await markFailed("Could not snapshot prompts — aborted before commit.");
      return NextResponse.json(
        { error: "Could not snapshot prompts." },
        { status: 500 },
      );
    }
    const snapshotId = snapRow.id as string;

    // Commit to GitHub (triggers Vercel redeploy)
    const commitMsg = `feat: prompt update via feedback — ${truncate(feedbackText, 60)}`;
    try {
      await commitFile({
        path: PROMPTS_PATH,
        message: commitMsg,
        content: updatedContent,
        sha: file.sha,
      });
    } catch (ghErr) {
      const msg = ghErr instanceof Error ? ghErr.message : String(ghErr);
      console.error("[api/feedback/submit] GitHub commit failed:", ghErr);
      await markFailed(`GitHub commit failed: ${msg}`);
      return NextResponse.json(
        { error: "GitHub commit failed. See server logs." },
        { status: 502 },
      );
    }

    // Flip is_active flags — the just-taken pre-change snapshot is the
    // current roll-back target, so mark it as active.
    await service
      .from("prompt_snapshots")
      .update({ is_active: false })
      .neq("id", snapshotId);
    await service
      .from("prompt_snapshots")
      .update({ is_active: true })
      .eq("id", snapshotId);

    // Finalise feedback row
    const analysisNote =
      skipped.length > 0
        ? `${ai.explanation}\n[skipped: ${skipped
            .map((s) => `bot=${s.bot} ${s.reason}`)
            .join(", ")}]`
        : ai.explanation;
    await service
      .from("feedback")
      .update({
        status: "applied",
        ai_analysis: analysisNote,
        snapshot_id: snapshotId,
      })
      .eq("id", feedbackId);

    console.log(
      `[api/feedback/submit] caller=${caller.email} applied=${applied.length} skipped=${skipped.length} snapshot=${snapshotId}`,
    );

    return NextResponse.json({
      success: true,
      changes: applied,
      skipped,
      explanation: ai.explanation,
      snapshot_id: snapshotId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/feedback/submit] unexpected error:", err);
    await markFailed(msg);
    return NextResponse.json(
      { error: "Unexpected error. See server logs." },
      { status: 500 },
    );
  }
}
