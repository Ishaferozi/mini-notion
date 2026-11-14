"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { MemberRole } from "@/lib/types";

interface OrgSettingsClientProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
  logoUrl: string | null;
  userRole: MemberRole;
}

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export function OrgSettingsClient({
  orgId, orgName, orgSlug, logoUrl, userRole,
}: OrgSettingsClientProps) {
  const router = useRouter();
  const [name, setName] = useState(orgName);
  const [slug, setSlug] = useState(orgSlug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isAdminUser = userRole === "admin";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (slug.length < 2) { setError("Slug must be at least 2 characters."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Org info */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800 mb-4">Organization Information</h2>

        {/* Org avatar */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-neutral-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white text-2xl font-bold uppercase">
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-neutral-800">{orgName}</p>
            <p className="text-sm text-neutral-500">{orgSlug}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Organization name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            maxLength={100}
            required
            disabled={!isAdminUser}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="URL slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="acme-corp"
              maxLength={50}
              required
              disabled={!isAdminUser}
            />
            <p className="text-xs text-neutral-400">
              Workspace identifier:{" "}
              <span className="font-medium text-[var(--color-accent)]">{slug || "your-org"}</span>
            </p>
          </div>

          {!isAdminUser && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Only the organization owner can change these settings.
            </p>
          )}

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600 font-medium">✓ Settings updated successfully.</p>}

          {isAdminUser && (
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Save changes
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Danger zone — owner only */}
      {isAdminUser && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-800 mb-1">Danger Zone</h2>
          <p className="text-xs text-red-600 mb-4">
            These actions are permanent and cannot be undone.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => window.confirm("Archive this organization? All data will be preserved but inaccessible.") && undefined}
            >
              Archive organization
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
