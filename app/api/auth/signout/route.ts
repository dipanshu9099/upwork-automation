import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("[api/auth/signout] signOut failed — continuing with redirect:", err);
  }
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
