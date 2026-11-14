"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { MemberRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

interface ProfileClientProps {
  userId: string;
  email: string;
  role: MemberRole;
  orgName: string;
  orgSlug: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-blue-100 text-blue-700",
  employee: "bg-neutral-100 text-neutral-600",
};

export function ProfileClient({ userId, email, role, orgName, orgSlug }: ProfileClientProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setPwError(error.message); return; }
      setPwSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your account details.</p>
      </div>

      {/* Account info */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-neutral-800">Account Information</h2>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-2xl font-bold uppercase">
            {email.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-neutral-800">{email.split("@")[0]}</p>
            <p className="text-sm text-neutral-500">{email}</p>
            <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[role]}`}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-neutral-100">
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1">Email</p>
            <p className="text-sm text-neutral-800">{email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1">Role</p>
            <p className="text-sm text-neutral-800 capitalize">{ROLE_LABELS[role]}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1">Organization</p>
            <p className="text-sm text-neutral-800">{orgName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1">Workspace URL</p>
            <p className="text-sm text-[var(--color-accent)] font-medium">{orgSlug}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
          <PasswordInput
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Repeat new password"
            required
            error={confirmPassword && confirmPassword !== newPassword ? "Passwords don't match" : undefined}
          />
          {pwError && <p role="alert" className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600 font-medium">✓ Password updated successfully.</p>}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={pwLoading}>
              Update password
            </Button>
          </div>
        </form>
      </div>

      {/* Sign out */}
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-800 mb-1">Sign out</h2>
        <p className="text-xs text-red-600 mb-3">You will be redirected to the login page.</p>
        <Button variant="danger" size="sm" onClick={handleSignOut}>
          Sign out of account
        </Button>
      </div>
    </div>
  );
}
