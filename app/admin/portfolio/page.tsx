import { createServiceClient } from "@/lib/supabase/service";
import PortfolioForm from "./PortfolioForm";

type PortfolioRow = {
  id: string;
  name: string;
  url: string | null;
  category: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  let items: PortfolioRow[] = [];
  let loadError: string | null = null;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id, name, url, category, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[admin/portfolio/page] list fetch failed:", error.message);
      loadError = "Could not load existing items.";
    } else {
      items = data ?? [];
    }
  } catch (err) {
    console.warn("[admin/portfolio/page] unexpected list error:", err);
    loadError = "Could not load existing items.";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Portfolio</h1>
      <p className="mt-1 text-sm text-gray-600">
        Add a new portfolio item. It is embedded with Gemini text-embedding-004 on save.
      </p>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <PortfolioForm />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Existing items ({items.length})</h2>
        {loadError ? (
          <p className="mt-3 text-sm text-red-600">{loadError}</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No items yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-gray-900">{item.name}</td>
                    <td className="px-4 py-2 text-gray-600">{item.category ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {item.url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
