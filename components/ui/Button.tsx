import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
  secondary:
    "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-300",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-300",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-red-600",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs rounded-md gap-1.5",
  md: "h-9 px-3.5 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-base rounded-lg gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-offset-1",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
