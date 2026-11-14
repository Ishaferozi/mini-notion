"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-semibold text-neutral-800">Password updated!</p>
        <p className="text-sm text-neutral-500">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <PasswordInput
        label="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        required
      />
      <PasswordInput
        label="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="Repeat your password"
        required
        error={confirmPassword && confirmPassword !== password ? "Passwords don't match" : undefined}
      />

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-1">
        {loading ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
