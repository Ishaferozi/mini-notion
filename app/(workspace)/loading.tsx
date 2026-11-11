import { Spinner } from "@/components/ui/Spinner";

/**
 * Shown while workspace route segments are loading.
 * Renders inside the workspace layout (sidebar is already visible).
 */
export default function WorkspaceLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner size="lg" label="Loading page…" />
    </div>
  );
}
