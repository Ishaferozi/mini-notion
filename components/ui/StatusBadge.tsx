import type { TaskStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
}

const CONFIG: Record<TaskStatus, { label: string; classes: string }> = {
  todo:        { label: "To Do",       classes: "bg-neutral-100 text-neutral-600" },
  in_progress: { label: "In Progress", classes: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completed",   classes: "bg-emerald-100 text-emerald-700" },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { label, classes } = CONFIG[status] ?? CONFIG.todo;
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${classes} ${sizeClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
