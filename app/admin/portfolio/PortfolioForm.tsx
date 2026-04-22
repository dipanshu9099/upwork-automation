"use client";

import { useState, useTransition } from "react";
import { addPortfolioItem } from "./actions";
import { PORTFOLIO_CATEGORIES } from "./constants";

export default function PortfolioForm() {
  const [status, setStatus] = useState<{ type: "ok" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resetKey, setResetKey] = useState(0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addPortfolioItem(formData);
      if (result.ok) {
        setStatus({ type: "ok", msg: "Saved." });
        setResetKey((k) => k + 1);
      } else {
        setStatus({ type: "error", msg: result.error });
      }
    });
  }

  return (
    <form key={resetKey} onSubmit={onSubmit} className="space-y-4">
      <Field label="Name" name="name" required placeholder="Project name" />
      <Field label="URL" name="url" type="url" placeholder="https://example.com" />
      <TextArea label="Description" name="description" rows={3} />
      <TextArea label="Use Cases" name="use_cases" rows={3} />
      <TextArea label="Tech Stack" name="tech_stack" rows={2} />
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a category…
          </option>
          {PORTFOLIO_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
        {isPending ? "Saving…" : "Save item"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  rows = 3,
}: {
  label: string;
  name: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
