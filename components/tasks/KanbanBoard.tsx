"use client";

import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo",        label: "To Do",       color: "bg-neutral-100 text-neutral-600" },
  { status: "in_progress", label: "In Progress",  color: "bg-blue-100 text-blue-700" },
  { status: "completed",   label: "Completed",    color: "bg-emerald-100 text-emerald-700" },
];

interface KanbanBoardProps {
  tasks: Task[];
  memberMap: Record<string, string>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDetail: (task: Task) => void;
}

export function KanbanBoard({ tasks, memberMap, onStatusChange, onDetail }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-3">
            {/* Column header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs text-neutral-400 font-medium">{colTasks.length}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2.5 min-h-[200px] rounded-xl bg-neutral-50 border border-neutral-200 p-3">
              {colTasks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-xs text-neutral-400">No tasks</p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div key={task.id}>
                    <TaskCard
                      task={task}
                      assigneeEmail={task.assignee_id ? memberMap[task.assignee_id] : null}
                      onClick={() => onDetail(task)}
                    />
                    {/* Quick status move buttons */}
                    <div className="flex items-center gap-1 mt-1 px-1">
                      {COLUMNS.filter((c) => c.status !== col.status).map((c) => (
                        <button
                          key={c.status}
                          onClick={() => onStatusChange(task.id, c.status)}
                          className="flex-1 rounded-md py-0.5 text-[10px] font-medium text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
