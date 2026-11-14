"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Send, Calendar, User, FolderOpen } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface TaskDetailsProps {
  task: Task | null;
  projectName?: string;
  assigneeEmail?: string | null;
  currentUserId: string;
  onClose: () => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export function TaskDetails({
  task, projectName, assigneeEmail, currentUserId, onClose, onStatusChange,
}: TaskDetailsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!task) { setComments([]); return; }
    setLoading(true);
    fetch(`/api/tasks/${task.id}/comments`)
      .then((r) => r.json())
      .then((j) => setComments(j.data ?? []))
      .finally(() => setLoading(false));
  }, [task?.id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !newComment.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    if (res.ok) {
      const j = await res.json();
      setComments((prev) => [...prev, j.data]);
      setNewComment("");
    }
    setSending(false);
  }

  if (!task) return null;

  const isOverdue = task.due_date && task.status !== "completed" && new Date(task.due_date) < new Date();

  return (
    <Modal open={!!task} onClose={onClose} title="Task Details" maxWidth="max-w-xl">
      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-neutral-600 mt-1.5 whitespace-pre-wrap">{task.description}</p>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 border border-neutral-200 p-4">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Status</p>
            <StatusBadge status={task.status} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Priority</p>
            <PriorityBadge priority={task.priority} />
          </div>
          {projectName && (
            <div>
              <p className="text-xs text-neutral-400 mb-1 flex items-center gap-1"><FolderOpen className="h-3 w-3" />Project</p>
              <p className="text-sm font-medium text-neutral-700">{projectName}</p>
            </div>
          )}
          {assigneeEmail && (
            <div>
              <p className="text-xs text-neutral-400 mb-1 flex items-center gap-1"><User className="h-3 w-3" />Assignee</p>
              <div className="flex items-center gap-1.5">
                <Avatar name={assigneeEmail} size="xs" />
                <span className="text-sm text-neutral-700">{assigneeEmail.split("@")[0]}</span>
              </div>
            </div>
          )}
          {task.due_date && (
            <div>
              <p className="text-xs text-neutral-400 mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Due date</p>
              <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-neutral-700"}`}>
                {new Date(task.due_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                {isOverdue && " (Overdue)"}
              </p>
            </div>
          )}
        </div>

        {/* Update status */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-700 shrink-0 w-28">Update status</label>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="flex-1 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Comments */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3">
            Comments ({comments.length})
          </h4>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-3 pr-1">
            {loading ? (
              <p className="text-xs text-neutral-400 text-center py-4">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No comments yet.</p>
            ) : comments.map((c) => (
              <div key={c.id} className={[
                "rounded-lg px-3 py-2.5 text-sm",
                c.user_id === currentUserId
                  ? "bg-violet-50 border border-violet-100 ml-6"
                  : "bg-neutral-50 border border-neutral-200 mr-6",
              ].join(" ")}>
                <p className="text-neutral-800">{c.content}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {new Date(c.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {c.user_id === currentUserId && " · You"}
                </p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              maxLength={5000}
              className="flex-1 h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || sending}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
