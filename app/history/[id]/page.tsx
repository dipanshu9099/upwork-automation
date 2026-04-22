import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

type ProposalRow = {
  id: string;
  job_input: string;
  proposal_output: string;
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

export default async function ProposalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  let proposal: ProposalRow | null = null;
  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("id, job_input, proposal_output, created_at")
      .eq("id", params.id)
      .maybeSingle();
    if (error) {
      console.warn("[history/[id]/page] query error:", error.message);
    } else {
      proposal = data;
    }
  } catch (err) {
    console.warn("[history/[id]/page] unexpected error:", err);
  }

  if (!proposal) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/history" className="text-sm text-gray-600 hover:text-gray-900">
        ← Back to history
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">Proposal</h1>
      <p className="mt-1 text-xs text-gray-500">
        Generated {formatTimestamp(proposal.created_at)}
      </p>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Job input</h2>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-gray-800">
          {proposal.job_input}
        </pre>
      </section>

      <section className="mt-6 rounded-lg border border-green-400 bg-white p-5 shadow-sm ring-1 ring-green-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Your proposal</h2>
          <CopyButton text={proposal.proposal_output} />
        </div>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-gray-800">
          {proposal.proposal_output}
        </pre>
      </section>
    </div>
  );
}
