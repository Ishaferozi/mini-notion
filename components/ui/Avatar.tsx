interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE: Record<string, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

// Deterministic colour from name
const COLOURS = [
  "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-sky-500",
  "bg-teal-500",   "bg-emerald-500","bg-amber-500", "bg-rose-500",
];

function colourFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOURS[Math.abs(hash) % COLOURS.length];
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center rounded-full text-white font-semibold select-none",
        SIZE[size],
        colourFor(name),
        className,
      ].join(" ")}
      title={name}
      aria-label={name}
    >
      {initials || "?"}
    </div>
  );
}

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: AvatarProps["size"];
}

export function AvatarGroup({ names, max = 3, size = "sm" }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const extra = names.length - max;
  const sizeClass = SIZE[size];
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} className="ring-2 ring-white" />
      ))}
      {extra > 0 && (
        <div className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 font-semibold ring-2 ring-white text-xs ${sizeClass}`}>
          +{extra}
        </div>
      )}
    </div>
  );
}
