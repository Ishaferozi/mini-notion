"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskDetails } from "@/components/tasks/TaskDetails";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskFilters, type TaskFilterState } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/Button";

interface Props {
  tasks: Task[];
  projects: { id: string; name: string }[];
  currentUserId: string;
  orgId: string;
}

export function EmployeeTasksClient({ tasks, projects, currentUserId, orgId }: Props) {
  const router = useRouter();

  const [filters, setFilters] = useState<TaskFilterState>({
    search: "", status: "all", priority: "all", project: "all", assignee: "all", sortByDue: "asc",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

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

  async function handleCreate(data: Partial<Task>) {
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        project_id: data.project_id,
        priority: data.priority,
        due_date: data.due_date,
        assignee_id: currentUserId,
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      throw new Error(j.error);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        projects={projects}
        showAssignee={false}
      >
        {projects.length > 0 && (
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New task
          </Button>
        )}
      </TaskFilters>

      <p className="text-xs text-neutral-500">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</p>

      <TaskTable
        tasks={filtered}
        projectMap={projectMap}
        memberMap={{}}
        onStatusChange={handleStatusChange}
        onDetail={(t) => setDetailTask(t)}
        isAdmin={false}
      />

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        projects={projects}
        members={[]}
        isAdmin={false}
      />

      <TaskDetails
        task={detailTask}
        projectName={detailTask ? projectMap[detailTask.project_id] : undefined}
        assigneeEmail={null}
        currentUserId={currentUserId}
        onClose={() => setDetailTask(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
