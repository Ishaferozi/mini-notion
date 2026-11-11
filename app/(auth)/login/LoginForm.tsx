"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

type ErrorState =
  | { type: "generic"; message: string }
  | { type: "unconfirmed"; email: string };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorState(null);
    setResendStatus("idle");

    if (!email.trim()) {
      setErrorState({ type: "generic", message: "Please enter your email address." });
      return;
    }
    if (!password) {
      setErrorState({ type: "generic", message: "Please enter your password." });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const lower = authError.message.toLowerCase();

        if (lower.includes("email not confirmed")) {
          // Show a dedicated panel with a resend button instead of a plain message
          setErrorState({ type: "unconfirmed", email: email.trim() });
          return;
        }

        if (
          lower.includes("invalid login credentials") ||
          lower.includes("invalid credentials")
        ) {
          setErrorState({
            type: "generic",
            message: "Incorrect email or password. Please try again.",
          });
          return;
        }

        if (lower.includes("too many requests") || lower.includes("rate limit")) {
          setErrorState({
            type: "generic",
            message: "Too many attempts. Please wait a moment and try again.",
          });
          return;
        }

        setErrorState({ type: "generic", message: authError.message });
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrorState({
        type: "generic",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (errorState?.type !== "unconfirmed") return;
    setResendStatus("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: errorState.email,
      });
      setResendStatus(error ? "failed" : "sent");
    } catch {
      setResendStatus("failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setErrorState(null);
        }}
        autoComplete="email"
        placeholder="you@example.com"
        required
      />

      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setErrorState(null);
        }}
        autoComplete="current-password"
        placeholder="Enter your password"
        required
      />

      {/* Generic error */}
      {errorState?.type === "generic" && (
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
          <span>{errorState.message}</span>
        </div>
      )}

      {/* Email-not-confirmed panel */}
      {errorState?.type === "unconfirmed" && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
        >
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                Please confirm your email first
              </p>
              <p className="mt-0.5 text-amber-700">
                We sent a confirmation link to{" "}
                <span className="font-medium">{errorState.email}</span>. Check
                your inbox (and spam folder).
              </p>

              {resendStatus === "sent" ? (
                <p className="mt-2 font-medium text-green-700">
                  ✓ New confirmation email sent!
                </p>
              ) : resendStatus === "failed" ? (
                <p className="mt-2 text-red-600">
                  Couldn&apos;t resend — please try again shortly.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendStatus === "sending"}
                  className="mt-2 text-amber-800 underline hover:no-underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                >
                  {resendStatus === "sending"
                    ? "Sending…"
                    : "Resend confirmation email"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        className="w-full mt-1"
      >
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
