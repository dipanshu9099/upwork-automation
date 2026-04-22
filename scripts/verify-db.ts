import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [portfolio, proposals] = await Promise.all([
    supabase.from("portfolio_items").select("*", { count: "exact", head: true }),
    supabase.from("proposals").select("*", { count: "exact", head: true }),
  ]);

  console.log("portfolio_items:", {
    count: portfolio.count,
    error: portfolio.error?.message ?? null,
  });
  console.log("proposals:     ", {
    count: proposals.count,
    error: proposals.error?.message ?? null,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
