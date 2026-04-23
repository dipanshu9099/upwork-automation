import { createClient as createUserClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import AddUserForm from "./AddUserForm";
import DeleteUserButton from "./DeleteUserButton";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
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

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

export default async function AdminUsersPage() {
  const userClient = createUserClient();
  const {
    data: { user: caller },
  } = await userClient.auth.getUser();
  const callerId = caller?.id ?? null;

  let rows: UserRow[] = [];
  let loadError: string | null = null;
  try {
    const service = createServiceClient();
    const { data, error } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) {
      console.warn("[admin/users/page] listUsers failed:", error.message);
      loadError = "Could not load users.";
    } else {
      rows = (data.users ?? [])
        .map((u) => ({
          id: u.id,
          email: u.email ?? "(no email)",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  } catch (err) {
    console.warn("[admin/users/page] unexpected error:", err);
    loadError = "Could not load users.";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-gray-600">
        Add, list, and remove accounts for the HestaBit Bid Bot.
      </p>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Add user</h2>
        <p className="mt-1 text-xs text-gray-500">
          The new account is created with the password confirmed — the user
          can log in immediately at <code>/login</code>.
        </p>
        <div className="mt-4">
          <AddUserForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">
          {loadError ? "Users" : `${rows.length} user${rows.length === 1 ? "" : "s"}`}
        </h2>
        {loadError ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {loadError}
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            No users. Use the form above to add one.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Created
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Last sign in
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    {/* Delete column */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const isSelf = row.id === callerId;
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-2 text-gray-900">
                        {row.email}
                        {isSelf && (
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                            you
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {formatTimestamp(row.created_at)}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {formatTimestamp(row.last_sign_in_at)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isSelf ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <DeleteUserButton userId={row.id} email={row.email} />
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
