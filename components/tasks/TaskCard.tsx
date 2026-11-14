import type { Task } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Calendar, MessageSquare } from "lucide-react";

interface TaskCardProps {
  task: Task;
  assigneeEmail?: string | null;
  commentCount?: number;
  onClick?: () => void;
  onStatusChange?: (status: Task["status"]) => void;
}

export function TaskCard({ task, assigneeEmail, commentCount = 0, onClick }: TaskCardProps) {
  const isOverdue = task.due_date && task.status !== "completed" && new Date(task.due_date) < new Date();

  return (
    <div
      onClick={onClick}
      className={[
        "rounded-xl border bg-white p-3.5 shadow-sm cursor-pointer",
        "hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all",
        isOverdue ? "border-red-200" : "border-neutral-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-sm font-medium text-neutral-800 leading-snug line-clamp-2 flex-1">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-xs text-neutral-500 line-clamp-2 mb-2.5">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        <StatusBadge status={task.status} />
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? "text-red-500" : "text-neutral-400"}`}>
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-neutral-400">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
          {assigneeEmail && <Avatar name={assigneeEmail} size="xs" />}
        </div>
      </div>
    </div>
  );
}
