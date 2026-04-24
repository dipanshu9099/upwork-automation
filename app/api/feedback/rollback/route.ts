import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { commitFile, getFile } from "@/lib/github";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 30;

const PROMPTS_PATH = "lib/pipeline/prompts.ts";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GITHUB_TOKEN",
  "GITHUB_REPO_OWNER",
  "GITHUB_REPO_NAME",
];

function truncate(s: string, n: number): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length > n ? `${oneLine.slice(0, n)}…` : oneLine;
}

export async function POST(request: Request) {
  try {
    for (const k of REQUIRED_ENV) requireEnv(k);
  } catch (err) {
    console.error("[api/feedback/rollback] env validation failed:", err);
    return NextResponse.json(
      { error: "Server misconfiguration. Contact admin." },
      { status: 500 },
    );
  }

  let caller;
  try {
    const userClient = createUserClient();
    const { data } = await userClient.auth.getUser();
    caller = data.user;
  } catch (err) {
    console.error("[api/feedback/rollback] auth lookup failed:", err);
    return NextResponse.json({ error: "Auth failure." }, { status: 500 });
  }
  if (!caller) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let snapshotId: string;
  try {
    const body = (await request.json()) as { snapshot_id?: unknown };
    snapshotId =
      typeof body.snapshot_id === "string" ? body.snapshot_id.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!snapshotId) {
    return NextResponse.json(
      { error: "snapshot_id is required." },
      { status: 400 },
    );
  }

  try {
    const service = createServiceClient();

    const { data: snap, error: snapErr } = await service
      .from("prompt_snapshots")
      .select("id, content, triggered_by")
      .eq("id", snapshotId)
      .maybeSingle();
    if (snapErr) {
      console.error("[api/feedback/rollback] snapshot lookup failed:", snapErr);
      return NextResponse.json(
        { error: "Could not read snapshot." },
        { status: 500 },
      );
    }
    if (!snap) {
      return NextResponse.json(
        { error: "Snapshot not found." },
        { status: 404 },
      );
    }

    const snapContent = typeof snap.content === "string" ? snap.content : "";
    if (!snapContent) {
      return NextResponse.json(
        { error: "Snapshot content is empty." },
        { status: 500 },
      );
    }

    const current = await getFile(PROMPTS_PATH);

    // Snapshot current (pre-rollback) state so the rollback itself is
    // reversible. This snapshot is_active=false; the target snapshot will
    // become is_active=true after the commit.
    const preLabel = `rollback-to-${snapshotId.slice(0, 8)} (pre-rollback state)`;
    const { data: preSnap, error: preSnapErr } = await service
      .from("prompt_snapshots")
      .insert({
        triggered_by: preLabel,
        content: current.content,
        is_active: false,
      })
      .select("id")
      .single();
    if (preSnapErr || !preSnap) {
      console.error(
        "[api/feedback/rollback] pre-rollback snapshot failed:",
        preSnapErr,
      );
      return NextResponse.json(
        { error: "Could not snapshot current state." },
        { status: 500 },
      );
    }

    const triggeredBy =
      typeof snap.triggered_by === "string" ? snap.triggered_by : "";
    const commitMsg = `revert: rollback prompts to snapshot ${snapshotId.slice(0, 8)} — ${truncate(
      triggeredBy,
      60,
    )}`;
    try {
      await commitFile({
        path: PROMPTS_PATH,
        message: commitMsg,
        content: snapContent,
        sha: current.sha,
      });
    } catch (ghErr) {
      const msg = ghErr instanceof Error ? ghErr.message : String(ghErr);
      console.error("[api/feedback/rollback] GitHub commit failed:", ghErr);
      return NextResponse.json(
        { error: `GitHub commit failed: ${msg}` },
        { status: 502 },
      );
    }

    await service
      .from("prompt_snapshots")
      .update({ is_active: false })
      .neq("id", snapshotId);
    await service
      .from("prompt_snapshots")
      .update({ is_active: true })
      .eq("id", snapshotId);

    console.log(
      `[api/feedback/rollback] caller=${caller.email} target=${snapshotId} pre_rollback=${preSnap.id}`,
    );

    return NextResponse.json({
      success: true,
      snapshot_id: snapshotId,
      pre_rollback_snapshot_id: preSnap.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/feedback/rollback] unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error. See server logs." },
      { status: 500 },
    );
  }
}
