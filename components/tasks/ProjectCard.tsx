import type { Project, ProjectStatus } from "@/lib/types";
import { PROJECT_STATUS_LABELS } from "@/lib/types";
import { Calendar, CheckSquare, Pencil, Trash2, Users } from "lucide-react";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  on_hold:   "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  archived:  "bg-neutral-100 text-neutral-500",
};

interface ProjectCardProps {
  project: Project;
  taskTotal?: number;
  taskCompleted?: number;
  memberCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  isAdmin?: boolean;
}

export function ProjectCard({
  project, taskTotal = 0, taskCompleted = 0, memberCount = 0,
  onEdit, onDelete, onClick, isAdmin = false,
}: ProjectCardProps) {
  const progress = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;
  const isOverdue = project.due_date && project.status !== "completed" && new Date(project.due_date) < new Date();

  return (
    <div
      onClick={onClick}
      className={["rounded-xl border bg-white p-5 shadow-sm flex flex-col gap-4 transition-all", onClick ? "cursor-pointer hover:shadow-md hover:border-[var(--color-accent)]/30" : "", "border-neutral-200"].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-bold text-base uppercase">
            {project.name.charAt(0)}
          </div>
          <h3 className="font-semibold text-neutral-800 truncate">{project.name}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[project.status]}`}>
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-neutral-500 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <CheckSquare className="h-3 w-3" />{taskCompleted}/{taskTotal} tasks
          </span>
          <span className="text-xs font-semibold text-neutral-700">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          {memberCount > 0 && (
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{memberCount}</span>
          )}
          {project.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}>
              <Calendar className="h-3 w-3" />
              {new Date(project.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        {isAdmin && (onEdit || onDelete) && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
