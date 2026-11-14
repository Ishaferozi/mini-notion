import type { TaskPriority } from "@/lib/types";

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "md";
}

const CONFIG: Record<TaskPriority, { label: string; classes: string }> = {
  low:    { label: "Low",    classes: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium", classes: "bg-amber-100 text-amber-700" },
  high:   { label: "High",   classes: "bg-red-100 text-red-700" },
  urgent: { label: "Urgent", classes: "bg-pink-100 text-pink-800" },
};

export function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  const { label, classes } = CONFIG[priority] ?? CONFIG.medium;
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${classes} ${sizeClass}`}>
      {label}
    </span>
  );
}
