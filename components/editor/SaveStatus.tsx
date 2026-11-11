import type { SaveStatus } from "@/lib/types";

interface SaveStatusProps {
  status: SaveStatus;
}

/**
 * Shows a subtle save status indicator in the top bar.
 * - idle: nothing shown
 * - saving: spinner + "Saving…"
 * - saved: checkmark + "Saved"
 * - error: warning + "Save failed"
 */
export function SaveStatusIndicator({ status }: SaveStatusProps) {
  if (status === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Save status: ${status}`}
      className="flex items-center gap-1.5 text-xs"
    >
      {status === "saving" && (
        <>
          <svg
            className="h-3 w-3 animate-spin text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-neutral-400">Saving…</span>
        </>
      )}

      {status === "saved" && (
        <>
          <svg
            className="h-3.5 w-3.5 text-green-500"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-neutral-400">Saved</span>
        </>
      )}

      {status === "error" && (
        <>
          <svg
            className="h-3.5 w-3.5 text-red-500"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span className="text-red-500">Save failed — check connection</span>
        </>
      )}
    </div>
  );
}
