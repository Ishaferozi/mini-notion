"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

type Path = "choose" | "create-org" | "join-invite";

function PasswordStrengthBar({ password }: { password: string }) {
  const strength =
    password.length === 0 ? null
    : password.length < 8 ? "weak"
    : password.length < 12 ? "fair"
    : "strong";
  if (!strength) return null;
  const colors = { weak: "bg-red-400", fair: "bg-yellow-400", strong: "bg-green-500" };
  const labels = { weak: "Too short", fair: "Fair", strong: "Strong" };
  const textColors = { weak: "text-red-500", fair: "text-yellow-600", strong: "text-green-600" };
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex flex-1 gap-1">
        {(["weak", "fair", "strong"] as const).map((level, i) => (
          <div key={level} className={["h-1 flex-1 rounded-full transition-colors",
            strength === "weak" && i === 0 ? colors.weak
            : strength === "fair" && i <= 1 ? colors.fair
            : strength === "strong" ? colors.strong
            : "bg-neutral-200"].join(" ")} />
        ))}
      </div>
      <span className={`text-xs font-medium ${textColors[strength]}`}>{labels[strength]}</span>
    </div>
  );
}

interface AccountFieldsProps {
  email: string; password: string; confirmPassword: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
}

function AccountFields({ email, password, confirmPassword, onEmailChange, onPasswordChange, onConfirmChange }: AccountFieldsProps) {
  return (
    <>
      <Input label="Work email" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} autoComplete="email" placeholder="you@company.com" required />
      <div className="flex flex-col gap-1">
        <PasswordInput label="Password" value={password} onChange={(e) => onPasswordChange(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" required />
        <PasswordStrengthBar password={password} />
      </div>
      <PasswordInput label="Confirm password" value={confirmPassword} onChange={(e) => onConfirmChange(e.target.value)} autoComplete="new-password" placeholder="Repeat your password" required
        error={confirmPassword && confirmPassword !== password ? "Passwords don't match" : undefined} />
    </>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 border border-red-200">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInvite = searchParams.get("invite") === "1";

  const [path, setPath] = useState<Path>(hasInvite ? "join-invite" : "choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return "Please enter your email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (authError) { setError(authError.message); return; }
      router.push("/org-setup");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (authError) { setError(authError.message); return; }
      setJoinSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Path selection ──────────────────────────────────────────────────────────
  if (path === "choose") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-500 text-center mb-2">How do you want to get started?</p>
        <button
          onClick={() => setPath("create-org")}
          className="flex items-start gap-4 rounded-xl border-2 border-transparent bg-neutral-50 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-neutral-800">Create an organization</p>
            <p className="text-xs text-neutral-500 mt-0.5">Set up a new workspace for your team. You'll become the owner.</p>
          </div>
        </button>
        <button
          onClick={() => setPath("join-invite")}
          className="flex items-start gap-4 rounded-xl border-2 border-transparent bg-neutral-50 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-200 text-neutral-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-neutral-800">Join via invitation</p>
            <p className="text-xs text-neutral-500 mt-0.5">I have an invitation link from my organization's admin.</p>
          </div>
        </button>
      </div>
    );
  }

  // ── Create org form ─────────────────────────────────────────────────────────
  if (path === "create-org") {
    return (
      <form onSubmit={handleCreateOrg} noValidate className="flex flex-col gap-4">
        <button type="button" onClick={() => { setPath("choose"); setError(null); }}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 self-start mb-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider -mb-1">Creating an organization</p>
        <AccountFields email={email} password={password} confirmPassword={confirmPassword}
          onEmailChange={setEmail} onPasswordChange={setPassword} onConfirmChange={setConfirmPassword} />
        {error && <ErrorAlert message={error} />}
        <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-1">
          {loading ? "Creating account…" : "Continue to org setup →"}
        </Button>
      </form>
    );
  }

  // ── Join via invite form ────────────────────────────────────────────────────
  return (
    <form onSubmit={handleJoinInvite} noValidate className="flex flex-col gap-4">
      <button type="button" onClick={() => { setPath("choose"); setError(null); setJoinSuccess(false); }}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 self-start mb-1">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>
      <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider -mb-1">Join via invitation</p>

      {joinSuccess ? (
        // ── Success screen ──────────────────────────────────────────────────
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-neutral-800">Account created!</p>
            <p className="text-sm text-neutral-500 mt-1">
              Now go back to your invitation link and click <strong>Accept invitation</strong>.
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-left w-full">
            <p className="font-medium mb-1">Next step:</p>
            <p>Open the invitation link your admin sent you and click <strong>"Accept invitation →"</strong></p>
          </div>
          <a href="/login" className="text-sm text-[var(--color-accent)] hover:underline font-medium">
            Or sign in first →
          </a>
        </div>
      ) : (
        // ── Signup fields ───────────────────────────────────────────────────
        <>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
            Create your account first, then click your invitation link to join your organization.
          </div>
          <AccountFields email={email} password={password} confirmPassword={confirmPassword}
            onEmailChange={setEmail} onPasswordChange={setPassword} onConfirmChange={setConfirmPassword} />
          {error && <ErrorAlert message={error} />}
          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-1">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </>
      )}
    </form>
  );
}
