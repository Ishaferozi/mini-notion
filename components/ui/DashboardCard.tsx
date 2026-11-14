import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;   // tailwind bg class
  trend?: { value: string; up: boolean };
}

export function DashboardCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "bg-violet-500",
  trend,
}: DashboardCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={["flex h-10 w-10 items-center justify-center rounded-xl text-white", iconColor].join(" ")}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={[
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            <span className={trend.up ? "" : "rotate-180 inline-block"}>↑</span>
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
        <p className="text-sm font-medium text-neutral-600 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
