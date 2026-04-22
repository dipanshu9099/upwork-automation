"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/history/error] unhandled error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-red-900">
          Couldn&apos;t load your proposals
        </h1>
        <p className="mt-2 text-sm text-red-800">
          Something went wrong fetching your history. Please try again.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try again
          </button>
          <Link
            href="/chat"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Chat
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-gray-500">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
