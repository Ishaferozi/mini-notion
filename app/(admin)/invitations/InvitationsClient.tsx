"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RefreshCw, Trash2, Send, Mail } from "lucide-react";
import type { Invitation, MemberRole } from "@/lib/types";
import { getInvitationStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const STATUS_BADGE = {
  pending:  "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  expired:  "bg-neutral-100 text-neutral-500",
};

const STATUS_LABEL = {
  pending:  "Pending",
  accepted: "Accepted",
  expired:  "Expired",
};

interface InvitationsClientProps {
  invitations: Invitation[];
}

export function InvitationsClient({ invitations }: InvitationsClientProps) {
  const router = useRouter();

  // Form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("employee");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Table actions
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "expired">("all");

  const filtered = useMemo(() => {
    return invitations.filter((inv) => {
      if (statusFilter === "all") return true;
      return getInvitationStatus(inv) === statusFilter;
    });
  }, [invitations, statusFilter]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSending(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json.error); return; }
      setFormSuccess(`Invitation sent to ${email.trim()}`);
      setEmail("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleResend(inv: Invitation) {
    setResending(inv.id);
    setTableError(null);
    // Delete old, create new
    await fetch(`/api/admin/invitations?invitation_id=${inv.id}`, { method: "DELETE" });
    const res = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inv.email, role: inv.role }),
    });
    setResending(null);
    if (!res.ok) { const j = await res.json(); setTableError(j.error); return; }
    router.refresh();
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setRevoking(true);
    const res = await fetch(`/api/admin/invitations?invitation_id=${revokeTarget.id}`, { method: "DELETE" });
    setRevoking(false);
    setRevokeTarget(null);
    if (!res.ok) { const j = await res.json(); setTableError(j.error); return; }
    router.refresh();
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Send invitation form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-[var(--color-accent)]" />
          Send Invitation
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:w-36">
            <label className="text-sm font-medium text-neutral-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" variant="primary" size="md" loading={sending} className="sm:mb-0">
            <Send className="h-3.5 w-3.5" />
            Send invite
          </Button>
        </form>
        {formError && <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>}
        {formSuccess && <p className="mt-3 text-sm text-emerald-600 font-medium flex items-center gap-1"><Check className="h-3.5 w-3.5" /> {formSuccess}</p>}
      </div>

      {/* Invitations table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-neutral-50">
          <h2 className="text-sm font-semibold text-neutral-700">
            All Invitations ({invitations.length})
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-7 rounded-lg border border-neutral-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {tableError && (
          <div className="mx-5 mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{tableError}</div>
        )}

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-neutral-400 text-center">No invitations found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Expires</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((inv) => {
                const status = getInvitationStatus(inv);
                const isPending = status === "pending";
                return (
                  <tr key={inv.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-neutral-800">{inv.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-neutral-600 capitalize">{inv.role}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-500 hidden md:table-cell">
                      {new Date(inv.expires_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => copyLink(inv.token)}
                              title="Copy invite link"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                            >
                              {copied === inv.token ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleResend(inv)}
                              disabled={resending === inv.id}
                              title="Resend invitation"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={["h-3.5 w-3.5", resending === inv.id ? "animate-spin" : ""].join(" ")} />
                            </button>
                            <button
                              onClick={() => setRevokeTarget(inv)}
                              title="Revoke invitation"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke invitation"
        message={`Revoke the invitation sent to ${revokeTarget?.email}? The invite link will no longer work.`}
        confirmLabel="Revoke"
        loading={revoking}
      />
    </div>
  );
}
