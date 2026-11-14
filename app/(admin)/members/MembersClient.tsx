"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { MemberRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Member {
  id: string;
  user_id: string;
  role: MemberRole;
  email: string;
  display_name: string | null;
  joined_at: string;
  last_sign_in: string | null;
}

interface MembersClientProps {
  members: Member[];
  currentUserId: string;
}

const ROLE_BADGE: Record<MemberRole, string> = {
  admin: "bg-violet-100 text-violet-700",
  employee: "bg-neutral-100 text-neutral-600",
};

export function MembersClient({ members, currentUserId }: MembersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "all">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.display_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || m.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [members, search, roleFilter]);

  const adminCount = members.filter((m) => m.role === "admin").length;

  async function handleRoleChange(memberId: string, newRole: MemberRole) {
    // Last-admin protection
    if (newRole === "employee") {
      const member = members.find((m) => m.id === memberId);
      if (member?.role === "admin" && adminCount <= 1) {
        setError("Cannot demote the last admin. Promote another member to Admin first.");
        return;
      }
    }
    setLoading(memberId);
    setError(null);
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, role: newRole }),
    });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) { setError(json.error); return; }
    router.refresh();
  }

  async function handleRemoveConfirm() {
    if (!confirmRemove) return;
    setRemoving(true);
    const res = await fetch(`/api/admin/members?member_id=${confirmRemove.id}`, { method: "DELETE" });
    setRemoving(false);
    setConfirmRemove(null);
    if (!res.ok) { const j = await res.json(); setError(j.error); return; }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search members…"
            className="w-56"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as MemberRole | "all")}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
          </select>
        </div>
        <p className="text-sm text-neutral-500">
          {filtered.length} of {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-neutral-700">No members found</p>
            <p className="text-xs text-neutral-400">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Member</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Last active</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((m) => {
                const isCurrentUser = m.user_id === currentUserId;
                const isLoading = loading === m.id;

                return (
                  <tr key={m.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.email} size="sm" />
                        <div>
                          <p className="font-medium text-neutral-800">
                            {m.display_name ?? m.email.split("@")[0]}
                            {isCurrentUser && (
                              <span className="ml-1.5 rounded-full bg-violet-100 text-violet-600 px-1.5 py-0.5 text-[10px] font-medium">you</span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {!isCurrentUser ? (
                        <select
                          value={m.role}
                          disabled={isLoading}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="employee">Employee</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[m.role]}`}>
                          {ROLE_LABELS[m.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-500 hidden lg:table-cell">
                      {m.last_sign_in
                        ? new Date(m.last_sign_in).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                        : "Never"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-500 hidden md:table-cell">
                      {new Date(m.joined_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!isCurrentUser && (
                        <button
                          onClick={() => setConfirmRemove(m)}
                          disabled={isLoading}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium transition-colors"
                        >
                          {isLoading ? "…" : "Remove"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm remove dialog */}
      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove member"
        message={`Remove ${confirmRemove?.display_name ?? confirmRemove?.email} from the organization? They will lose all access immediately.`}
        confirmLabel="Remove"
        loading={removing}
      />
    </div>
  );
}
