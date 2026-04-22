export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Proposal history</h1>
      <p className="mt-1 text-sm text-gray-600">
        Every proposal you have generated, most recent first.
      </p>
      <ul className="mt-8 space-y-3" aria-busy="true" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-7 w-14 shrink-0 animate-pulse rounded-md bg-gray-200" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
