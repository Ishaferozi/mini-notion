"use client";

import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Pencil, Trash2, MessageSquare, CheckSquare } from "lucide-react";

interface TaskTableProps {
  tasks: Task[];
  projectMap: Record<string, string>;
  memberMap: Record<string, string>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onDetail: (task: Task) => void;
  isAdmin?: boolean;
}

export function TaskTable({
  tasks, projectMap, memberMap, onStatusChange, onEdit, onDelete, onDetail, isAdmin = false,
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm flex flex-col items-center justify-center py-16 gap-3">
        <CheckSquare className="h-8 w-8 text-neutral-200" />
        <p className="text-sm text-neutral-500">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</th>
              {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Project</th>}
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Assignee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Due</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {tasks.map((t) => {
              const isOverdue = t.due_date && t.status !== "completed" && new Date(t.due_date) < new Date();
              const assigneeEmail = t.assignee_id ? memberMap[t.assignee_id] : null;
              return (
                <tr key={t.id} className="hover:bg-neutral-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-neutral-800 truncate max-w-[200px]">{t.title}</p>
                    {t.description && <p className="text-xs text-neutral-400 truncate max-w-[200px] mt-0.5">{t.description}</p>}
                  </td>
                  {isAdmin && <td className="px-4 py-3.5 text-xs text-neutral-500 hidden md:table-cell truncate max-w-[120px]">{projectMap[t.project_id] ?? "—"}</td>}
                  <td className="px-4 py-3.5"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3.5">
                    <select
                      value={t.status}
                      onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
                      className="text-xs font-medium rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-transparent"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {assigneeEmail ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={assigneeEmail} size="xs" />
                        <span className="text-xs text-neutral-600 truncate max-w-[100px]">{assigneeEmail.split("@")[0]}</span>
                      </div>
                    ) : <span className="text-xs text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-neutral-500"}`}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onDetail(t)} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-[var(--color-accent)] transition-colors" title="Comments">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin && onEdit && (
                        <button onClick={() => onEdit(t)} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {isAdmin && onDelete && (
                        <button onClick={() => onDelete(t)} className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
