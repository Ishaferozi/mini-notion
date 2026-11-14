"use client";

import { useState, useEffect } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
  initial?: Task | null;
  projects: { id: string; name: string }[];
  members: { user_id: string; email: string }[];
  defaultProjectId?: string;
  isAdmin?: boolean;
}

export function TaskForm({
  open, onClose, onSave, initial, projects, members, defaultProjectId, isAdmin = false,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description ?? "");
      setProjectId(initial.project_id);
      setAssigneeId(initial.assignee_id ?? "");
      setPriority(initial.priority);
      setStatus(initial.status);
      setDueDate(initial.due_date ?? "");
    } else {
      setTitle(""); setDescription("");
      setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
      setAssigneeId(""); setPriority("medium"); setStatus("todo"); setDueDate("");
    }
    setError(null);
  }, [initial, open, defaultProjectId, projects]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        ...(initial ? { id: initial.id } : {}),
        title,
        description: description || undefined,
        project_id: projectId,
        assignee_id: assigneeId || undefined,
        priority,
        status,
        due_date: dueDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Task" : "New Task"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Task title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required maxLength={500} />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Add more context…" maxLength={10000} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none" />
        </div>
        {!initial && projects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        {isAdmin && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {initial && isAdmin && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            {initial ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
