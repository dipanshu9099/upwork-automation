import { createServiceClient } from "@/lib/supabase/service";
import FeedbackForm from "./FeedbackForm";

export const dynamic = "force-dynamic";

export interface FeedbackHistoryRow {
  id: string;
  created_at: string;
  feedback_text: string;
  status: string;
  snapshot_id: string | null;
  ai_analysis: string | null;
  error: string | null;
}

export default async function FeedbackPage() {
  // Last 20 feedback rows fetched via service role — the `feedback` table
  // has RLS set to service-only. The page is server-rendered so the key
  // never ships to the browser.
  let rows: FeedbackHistoryRow[] = [];
  let loadError: string | null = null;
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("feedback")
      .select("id, created_at, feedback_text, status, snapshot_id, ai_analysis, error")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.warn("[feedback/page] history fetch failed:", error.message);
      loadError = "Could not load change history.";
    } else {
      rows = (data ?? []) as FeedbackHistoryRow[];
    }
  } catch (err) {
    console.warn("[feedback/page] unexpected history error:", err);
    loadError = "Could not load change history.";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <FeedbackForm initialHistory={rows} loadError={loadError} />
    </div>
  );
}
