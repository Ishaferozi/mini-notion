"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import type { TaskStatus, TaskPriority } from "@/lib/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/types";

export interface TaskFilterState {
  search: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  project: string;
  assignee: string;
  sortByDue: "asc" | "desc" | "none";
}

interface TaskFiltersProps {
  filters: TaskFilterState;
  onChange: (f: TaskFilterState) => void;
  projects: { id: string; name: string }[];
  members?: { user_id: string; email: string }[];
  showAssignee?: boolean;
  children?: React.ReactNode; // extra buttons (New task etc.)
}

export function TaskFilters({
  filters, onChange, projects, members = [], showAssignee = false, children,
}: TaskFiltersProps) {
  function set(patch: Partial<TaskFilterState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={filters.search} onChange={(v) => set({ search: v })} placeholder="Search tasks…" className="w-44" />
        <select value={filters.status} onChange={(e) => set({ status: e.target.value as TaskStatus | "all" })}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => set({ priority: e.target.value as TaskPriority | "all" })}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
          <option value="all">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {projects.length > 0 && (
          <select value={filters.project} onChange={(e) => set({ project: e.target.value })}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {showAssignee && members.length > 0 && (
          <select value={filters.assignee} onChange={(e) => set({ assignee: e.target.value })}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
            <option value="all">All assignees</option>
            {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
          </select>
        )}
        <select value={filters.sortByDue} onChange={(e) => set({ sortByDue: e.target.value as "asc" | "desc" | "none" })}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
          <option value="none">Sort: Default</option>
          <option value="asc">Due: Earliest</option>
          <option value="desc">Due: Latest</option>
        </select>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
