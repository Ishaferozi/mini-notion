"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export function OrgSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Organization name must be at least 2 characters.");
      return;
    }
    if (slug.length < 2) {
      setError("URL slug must be at least 2 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/org/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to create organization.");
        return;
      }

      // Org created — go to admin dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Input
        label="Organization name"
        type="text"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Acme Corp"
        maxLength={100}
        required
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="URL slug"
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="acme-corp"
          maxLength={50}
          required
        />
        <p className="text-xs text-neutral-500">
          Your workspace URL:{" "}
          <span className="font-medium text-neutral-700">
            app.mininotion.com/<span className="text-[var(--color-accent)]">{slug || "your-org"}</span>
          </span>
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 border border-red-200">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
        {loading ? "Creating organization…" : "Create organization →"}
      </Button>
    </form>
  );
}
