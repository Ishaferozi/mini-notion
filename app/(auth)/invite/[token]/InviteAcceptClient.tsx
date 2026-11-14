"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  params: Promise<{ token: string }>;
}

interface InviteInfo {
  org_name: string;
  email: string;
  role: string;
  expires_at: string;
}

export function InviteAcceptClient({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [fetchState, setFetchState] = useState<"loading" | "found" | "error">("loading");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Load invitation details on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setFetchError(json.error ?? "Invalid or expired invitation.");
          setFetchState("error");
          return;
        }
        setInvite(json.data);
        setFetchState("found");
      } catch {
        setFetchError("Failed to load invitation. Please check your link.");
        setFetchState("error");
      }
    }
    load();
  }, [token]);

  async function handleAccept() {
    setAcceptError(null);
    setAccepting(true);
    try {
      // Ensure user is signed in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?redirectTo=/invite/${token}`);
        return;
      }

      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAcceptError(json.error ?? "Failed to accept invitation.");
        return;
      }
      // Accepted — go to employee dashboard
      router.push("/employee/dashboard");
      router.refresh();
    } catch {
      setAcceptError("An unexpected error occurred. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  if (fetchState === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Spinner size="md" />
        <p className="text-sm text-neutral-500">Loading invitation…</p>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-neutral-800">Invitation not found</p>
          <p className="text-sm text-neutral-500 mt-1">{fetchError}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => router.push("/login")}>
          Go to login
        </Button>
      </div>
    );
  }

  const isExpired = invite && new Date(invite.expires_at) < new Date();

  return (
    <div className="flex flex-col gap-5">
      {/* Org info */}
      <div className="rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 p-4">
        <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-1">
          Organization
        </p>
        <p className="text-lg font-bold text-neutral-800">{invite?.org_name}</p>
        <div className="mt-2 flex items-center gap-3 text-sm text-neutral-600">
          <span>
            Invited as{" "}
            <span className="font-medium capitalize text-neutral-800">
              {invite?.role}
            </span>
          </span>
          <span className="text-neutral-300">•</span>
          <span className="truncate">{invite?.email}</span>
        </div>
      </div>

      {isExpired && (
        <div role="alert" className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
          This invitation has expired. Please ask your admin to send a new one.
        </div>
      )}

      {acceptError && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          {acceptError}
        </div>
      )}

      <Button
        variant="primary"
        size="md"
        loading={accepting}
        disabled={!!isExpired}
        onClick={handleAccept}
        className="w-full"
      >
        {accepting ? "Joining organization…" : "Accept invitation →"}
      </Button>

      <p className="text-center text-xs text-neutral-500">
        Don&apos;t have an account?{" "}
        <a
          href={`/signup?invite=1`}
          className="text-[var(--color-accent)] hover:underline font-medium"
        >
          Sign up first
        </a>
      </p>
    </div>
  );
}
