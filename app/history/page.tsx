import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProposalRow = {
  id: string;
  job_input: string;
  created_at: string;
};

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
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

function buildPreview(text: string, max = 120): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max)}…` : collapsed;
}

export default async function HistoryPage() {
  const supabase = createClient();
  let rows: ProposalRow[] = [];
  let loadError = false;

  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("id, job_input, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[history/page] proposals query failed:", error.message);
      loadError = true;
    } else {
      rows = data ?? [];
    }
  } catch (err) {
    console.warn("[history/page] unexpected error:", err);
    loadError = true;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Proposal history</h1>
      <p className="mt-1 text-sm text-gray-600">
        Every proposal you have generated, most recent first.
      </p>

      {loadError ? (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Could not load your proposals. Please refresh.
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-700">No proposals yet.</p>
          <Link
            href="/chat"
            className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Generate your first proposal
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(row.created_at)}
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-800">
                    {buildPreview(row.job_input)}
                  </p>
                </div>
                <Link
                  href={`/history/${row.id}`}
                  className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
