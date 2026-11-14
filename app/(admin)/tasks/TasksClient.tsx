"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutList, Columns } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskTable } from "@/components/tasks/TaskTable";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskDetails } from "@/components/tasks/TaskDetails";
import { TaskFilters, type TaskFilterState } from "@/components/tasks/TaskFilters";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";

interface ProjectOption { id: string; name: string; }
interface MemberOption { id: string; user_id: string; role: string; email: string; }

interface TasksClientProps {
  tasks: Task[];
  projects: ProjectOption[];
  members: MemberOption[];
  currentUserId: string;
}

export function TasksClient({ tasks, projects, members, currentUserId }: TasksClientProps) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "kanban">("table");

  const [filters, setFilters] = useState<TaskFilterState>({
    search: "", status: "all", priority: "all", project: "all", assignee: "all", sortByDue: "none",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const memberOptions = members.map((m) => ({ user_id: m.user_id, email: m.email }));

  const memberMap = useMemo(() => {
    const m: Record<string, string> = {};
    members.forEach((mem) => { m[mem.user_id] = mem.email; });
    return m;
  }, [members]);

  const projectMap = useMemo(() => {
    const m: Record<string, string> = {};
    projects.forEach((p) => { m[p.id] = p.name; });
    return m;
  }, [projects]);

  const filtered = useMemo(() => {
    let result = tasks.filter((t) => {
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.priority !== "all" && t.priority !== filters.priority) return false;
      if (filters.project !== "all" && t.project_id !== filters.project) return false;
      if (filters.assignee !== "all" && t.assignee_id !== filters.assignee) return false;
      return true;
    });
    if (filters.sortByDue !== "none") {
      result = [...result].sort((a, b) => {
        const aT = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bT = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return filters.sortByDue === "asc" ? aT - bT : bT - aT;
      });
    }
    return result;
  }, [tasks, filters]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    await fetch("/api/admin/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, status: newStatus }),
    });
    if (detailTask?.id === taskId) setDetailTask((t) => t ? { ...t, status: newStatus } : null);
    router.refresh();
  }, [router, detailTask]);

  async function handleSaveTask(data: Partial<Task>) {
    const isEdit = !!data.id;
    const body = isEdit
      ? { task_id: data.id, title: data.title, description: data.description, priority: data.priority, status: data.status, assignee_id: data.assignee_id, due_date: data.due_date }
      : { title: data.title, description: data.description, project_id: data.project_id, assignee_id: data.assignee_id, priority: data.priority, due_date: data.due_date };

    const res = await fetch("/api/admin/tasks", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json();
      throw new Error(j.error);
    }
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/tasks?task_id=${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          projects={projects}
          members={memberOptions}
          showAssignee
        >
          <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
            <button onClick={() => setView("table")} className={["flex h-7 w-7 items-center justify-center rounded-md transition-colors", view === "table" ? "bg-[var(--color-accent)] text-white" : "text-neutral-500 hover:bg-neutral-100"].join(" ")} title="Table view">
              <LayoutList className="h-4 w-4" />
            </button>
            <button onClick={() => setView("kanban")} className={["flex h-7 w-7 items-center justify-center rounded-md transition-colors", view === "kanban" ? "bg-[var(--color-accent)] text-white" : "text-neutral-500 hover:bg-neutral-100"].join(" ")} title="Kanban view">
              <Columns className="h-4 w-4" />
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditTask(null); setFormOpen(true); }} disabled={projects.length === 0}>
            <Plus className="h-3.5 w-3.5" /> New task
          </Button>
        </TaskFilters>
      </div>

      {projects.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Create a project first before adding tasks.
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-neutral-500">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</p>

      {/* View */}
      {view === "table" ? (
        <TaskTable
          tasks={filtered}
          projectMap={projectMap}
          memberMap={memberMap}
          onStatusChange={handleStatusChange}
          onEdit={(t) => { setEditTask(t); setFormOpen(true); }}
          onDelete={(t) => setDeleteTarget(t)}
          onDetail={(t) => setDetailTask(t)}
          isAdmin
        />
      ) : (
        <KanbanBoard
          tasks={filtered}
          memberMap={memberMap}
          onStatusChange={handleStatusChange}
          onDetail={(t) => setDetailTask(t)}
        />
      )}

      {/* Task form */}
      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveTask}
        initial={editTask}
        projects={projects}
        members={memberOptions}
        isAdmin
      />

      {/* Task details + comments */}
      <TaskDetails
        task={detailTask}
        projectName={detailTask ? projectMap[detailTask.project_id] : undefined}
        assigneeEmail={detailTask?.assignee_id ? memberMap[detailTask.assignee_id] : null}
        currentUserId={currentUserId}
        onClose={() => setDetailTask(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete task"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete task"
        loading={deleting}
      />
    </div>
  );
}
