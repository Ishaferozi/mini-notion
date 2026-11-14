"use client";

import { useState, useEffect } from "react";
import type { Project, ProjectStatus } from "@/lib/types";
import { PROJECT_STATUS_LABELS } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
  initial?: Project | null;
}

export function ProjectForm({ open, onClose, onSave, initial }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setName(initial.name); setDescription(initial.description ?? "");
      setStatus(initial.status); setStartDate(initial.start_date ?? ""); setDueDate(initial.due_date ?? "");
    } else {
      setName(""); setDescription(""); setStatus("active"); setStartDate(""); setDueDate("");
    }
    setError(null);
  }, [initial, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (startDate && dueDate && dueDate < startDate) {
      setError("Due date must be on or after start date."); return;
    }
    setError(null); setSaving(true);
    try {
      await onSave({
        ...(initial ? { id: initial.id } : {}),
        name, description: description || undefined, status,
        start_date: startDate || undefined, due_date: dueDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Project" : "New Project"} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Project name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" required maxLength={200} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this project about?" maxLength={2000} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
              {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            {initial ? "Save changes" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
