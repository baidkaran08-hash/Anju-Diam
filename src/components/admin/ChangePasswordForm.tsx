"use client";

import { useState } from "react";

export default function ChangePasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);

    if (next !== again) {
      setError("The two new passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fieldMessage = data?.fields ? Object.values(data.fields as Record<string, string>)[0] : null;
        setError(fieldMessage || data?.error || "Could not change the password.");
        return;
      }

      setDone(true);
      setCurrent("");
      setNext("");
      setAgain("");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-6">
      <p className="text-sm text-graphite/55">
        Signed in as <span className="text-plum">{email}</span>
      </p>

      <label className="block">
        <span className="label-sm mb-2 block text-graphite/55">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          className="field"
        />
      </label>

      <label className="block">
        <span className="label-sm mb-2 block text-graphite/55">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          className="field"
        />
        <span className="mt-2 block text-xs text-graphite/40">At least 12 characters.</span>
      </label>

      <label className="block">
        <span className="label-sm mb-2 block text-graphite/55">New password again</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={again}
          onChange={(event) => setAgain(event.target.value)}
          className="field"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-wine">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-plum">
          Password changed. Use the new one next time you sign in.
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-gold disabled:opacity-60">
        {busy ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
