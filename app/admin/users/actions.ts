"use server";

import { revalidatePath } from "next/cache";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const MIN_PASSWORD_LENGTH = 8;

type ActionResult = { ok: true } | { ok: false; error: string };

function isEmail(value: string): boolean {
  // Intentionally permissive — Supabase does its own validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    const userClient = createUserClient();
    const {
      data: { user: caller },
    } = await userClient.auth.getUser();
    if (!caller) return { ok: false, error: "Not authenticated." };

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !isEmail(email)) {
      return { ok: false, error: "Invalid email." };
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return {
        ok: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }

    const service = createServiceClient();
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.warn(
        `[admin/users/createUser] caller=${caller.email} target=${email} failed: ${error.message}`,
      );
      return { ok: false, error: error.message };
    }

    console.log(
      `[admin/users/createUser] caller=${caller.email} created user ${data.user?.email} (id=${data.user?.id})`,
    );
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    console.error("[admin/users/createUser] unexpected error:", err);
    return { ok: false, error: "Unexpected error. See server logs." };
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    if (!userId || typeof userId !== "string") {
      return { ok: false, error: "Invalid user id." };
    }

    const userClient = createUserClient();
    const {
      data: { user: caller },
    } = await userClient.auth.getUser();
    if (!caller) return { ok: false, error: "Not authenticated." };

    if (caller.id === userId) {
      console.warn(
        `[admin/users/deleteUser] caller=${caller.email} attempted self-delete (blocked)`,
      );
      return { ok: false, error: "You cannot delete your own account." };
    }

    const service = createServiceClient();
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(
        `[admin/users/deleteUser] caller=${caller.email} target=${userId} failed: ${error.message}`,
      );
      return { ok: false, error: error.message };
    }

    console.log(
      `[admin/users/deleteUser] caller=${caller.email} deleted user ${userId}`,
    );
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    console.error("[admin/users/deleteUser] unexpected error:", err);
    return { ok: false, error: "Unexpected error. See server logs." };
  }
}
