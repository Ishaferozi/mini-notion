interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string; // tailwind bg color class e.g. "bg-violet-500"
  trend?: {
    value: string;
    up: boolean;
  };
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "bg-violet-500",
  trend,
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl text-white",
            accent,
          ].join(" ")}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={[
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.up
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            <svg
              className={["h-3 w-3", trend.up ? "" : "rotate-180"].join(" ")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
              />
            </svg>
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-sm font-medium text-neutral-600 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
