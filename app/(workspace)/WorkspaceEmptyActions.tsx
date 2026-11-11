"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

export function WorkspaceEmptyActions() {
  const router = useRouter();

  async function handleCreate() {
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", parent_id: null }),
    });

    if (res.ok) {
      const { data } = await res.json();
      router.push(`/pages/${data.id}`);
      router.refresh();
    }
  }

  return (
    <EmptyState
      title="No pages yet"
      description="Create your first page to get started with your workspace."
      action={{ label: "New page", onClick: handleCreate }}
    />
  );
}
