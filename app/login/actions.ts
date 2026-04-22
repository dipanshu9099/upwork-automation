"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.warn("[login/actions] signInWithPassword failed:", error.message);
      return { error: error.message };
    }
  } catch (err) {
    console.warn("[login/actions] unexpected error during sign in:", err);
    return { error: "Sign in failed. Please try again." };
  }

  redirect("/chat");
}
