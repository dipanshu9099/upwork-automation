import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/pipeline/run";
import { encodePipelineEvent } from "@/lib/pipeline/sse";
import type { PipelineEvent } from "@/lib/pipeline/types";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_JOB_INPUT_CHARS = 12_000;

const REQUIRED_ENV_VARS = [
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export async function POST(request: Request) {
  try {
    for (const key of REQUIRED_ENV_VARS) requireEnv(key);
  } catch (err) {
    console.error("[api/pipeline] env validation failed:", err);
    return NextResponse.json(
      { error: "Server misconfiguration. Contact admin." },
      { status: 500 },
    );
  }

  let user;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("[api/pipeline] auth lookup failed:", err);
    return NextResponse.json({ error: "Auth failure." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let jobInput: string;
  try {
    const body = (await request.json()) as { jobInput?: unknown };
    jobInput = typeof body.jobInput === "string" ? body.jobInput.trim() : "";
  } catch (err) {
    console.error("[api/pipeline] invalid JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (jobInput.length === 0) {
    return NextResponse.json({ error: "jobInput is required." }, { status: 400 });
  }
  if (jobInput.length > MAX_JOB_INPUT_CHARS) {
    return NextResponse.json(
      {
        error: `jobInput exceeds ${MAX_JOB_INPUT_CHARS} characters.`,
      },
      { status: 413 },
    );
  }

  const userId = user.id;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: PipelineEvent) => {
        try {
          controller.enqueue(encodePipelineEvent(event));
        } catch (err) {
          console.error("[api/pipeline] controller.enqueue failed:", err);
        }
      };

      try {
        await runPipeline({ userId, jobInput, emit });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[api/pipeline] pipeline threw at top level:", err);
        emit({ type: "pipeline-error", error: message });
        emit({ type: "done", proposalId: null });
      } finally {
        try {
          controller.close();
        } catch (err) {
          console.error("[api/pipeline] controller.close failed:", err);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
