"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "./actions";

export default function AddUserForm() {
  const router = useRouter();
  const [status, setStatus] = useState<
    { type: "ok" | "error"; msg: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [resetKey, setResetKey] = useState(0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.ok) {
        setStatus({ type: "ok", msg: `User ${email} created.` });
        setResetKey((k) => k + 1);
        router.refresh();
      } else {
        setStatus({ type: "error", msg: result.error });
      }
    });
  }

  return (
    <form key={resetKey} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="user-email"
          className="block text-sm font-medium text-gray-700"
        >
          Email <span className="text-red-600">*</span>
        </label>
        <input
          id="user-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="user-password"
          className="block text-sm font-medium text-gray-700"
        >
          Password <span className="text-red-600">*</span>
          <span className="ml-1 font-normal text-xs text-gray-500">
            (min 8 chars)
          </span>
        </label>
        <input
          id="user-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      {status && (
        <p
          className={
            status.type === "ok"
              ? "text-sm text-green-700"
              : "text-sm text-red-600"
          }
        >
          {status.msg}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Add user"}
      </button>
    </form>
  );
}
