"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live password strength hint
  const passwordStrength =
    password.length === 0
      ? null
      : password.length < 8
      ? "weak"
      : password.length < 12
      ? "fair"
      : "strong";

  const strengthColor = {
    weak: "bg-red-400",
    fair: "bg-yellow-400",
    strong: "bg-green-500",
  };
  const strengthLabel = {
    weak: "Too short",
    fair: "Fair",
    strong: "Strong",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
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
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-sm font-medium text-neutral-700">
          Account created! Redirecting…
        </p>
        <p className="text-xs text-neutral-500">
          Check your email if confirmation is required.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="you@example.com"
        required
      />

      <div className="flex flex-col gap-1">
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
        />
        {/* Strength bar */}
        {passwordStrength && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex flex-1 gap-1">
              {(["weak", "fair", "strong"] as const).map((level, i) => (
                <div
                  key={level}
                  className={[
                    "h-1 flex-1 rounded-full transition-colors",
                    passwordStrength === "weak" && i === 0
                      ? strengthColor.weak
                      : passwordStrength === "fair" && i <= 1
                      ? strengthColor.fair
                      : passwordStrength === "strong"
                      ? strengthColor.strong
                      : "bg-neutral-200",
                  ].join(" ")}
                />
              ))}
            </div>
            <span
              className={[
                "text-xs font-medium",
                passwordStrength === "weak"
                  ? "text-red-500"
                  : passwordStrength === "fair"
                  ? "text-yellow-600"
                  : "text-green-600",
              ].join(" ")}
            >
              {strengthLabel[passwordStrength]}
            </span>
          </div>
        )}
      </div>

      <PasswordInput
        label="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="Repeat your password"
        required
        error={
          confirmPassword && confirmPassword !== password
            ? "Passwords don't match"
            : undefined
        }
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 border border-red-200"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        className="w-full mt-1"
      >
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
