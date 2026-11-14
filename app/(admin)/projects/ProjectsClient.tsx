"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/types";
import { ProjectCard } from "@/components/tasks/ProjectCard";
import { ProjectForm } from "@/components/tasks/ProjectForm";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";

interface ProjectWithStats extends Project {
  task_total: number;
  task_completed: number;
  memberIds: string[];
}

interface MemberOption {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
}

interface ProjectsClientProps {
  projects: ProjectWithStats[];
  members: MemberOption[];
  orgId: string;
}

export function ProjectsClient({ projects, members, orgId }: ProjectsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  // Create / edit
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithStats | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Members modal
  const [membersProject, setMembersProject] = useState<ProjectWithStats | null>(null);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  const filtered = useMemo(() =>
    projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    }),
  [projects, search, statusFilter]);

  async function handleSave(data: Partial<Project>) {
    const isEdit = !!data.id;
    const res = await fetch("/api/admin/projects", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit
          ? { project_id: data.id, name: data.name, description: data.description, status: data.status, start_date: data.start_date, due_date: data.due_date }
          : { name: data.name, description: data.description, status: data.status, start_date: data.start_date, due_date: data.due_date }
      ),
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
    await fetch(`/api/admin/projects?project_id=${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null);
    router.refresh();
  }

  async function handleAddMember(projectId: string, userId: string) {
    setAddingMember(userId);
    await fetch("/api/admin/project-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, user_id: userId, org_id: orgId }),
    });
    setAddingMember(null);
    router.refresh();
  }

  async function handleRemoveMember(projectId: string, userId: string) {
    await fetch(`/api/admin/project-members?project_id=${projectId}&user_id=${userId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" className="w-56" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditProject(null); setFormOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> New project
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id}>
              <ProjectCard
                project={p}
                taskTotal={p.task_total}
                taskCompleted={p.task_completed}
                memberCount={p.memberIds.length}
                isAdmin
                onEdit={() => { setEditProject(p); setFormOpen(true); }}
                onDelete={() => setDeleteTarget(p)}
              />
              <button
                onClick={() => setMembersProject(p)}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                Manage members ({p.memberIds.length})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Project form */}
      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editProject}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete project"
        message={`Delete "${deleteTarget?.name}" and all its tasks? This cannot be undone.`}
        confirmLabel="Delete project"
        loading={deleting}
      />

      {/* Members modal */}
      <Modal open={!!membersProject} onClose={() => setMembersProject(null)} title={`Members — ${membersProject?.name}`} maxWidth="max-w-md">
        {membersProject && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {members.map((m) => {
                const isMember = membersProject.memberIds.includes(m.user_id);
                return (
                  <div key={m.user_id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-neutral-50 border border-neutral-100">
                    <Avatar name={m.email} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{m.display_name ?? m.email.split("@")[0]}</p>
                      <p className="text-xs text-neutral-400 truncate">{m.email}</p>
                    </div>
                    {isMember ? (
                      <button
                        onClick={() => handleRemoveMember(membersProject.id, m.user_id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddMember(membersProject.id, m.user_id)}
                        disabled={addingMember === m.user_id}
                        className="text-xs text-[var(--color-accent)] hover:underline font-medium disabled:opacity-50 transition-colors"
                      >
                        {addingMember === m.user_id ? "Adding…" : "Add"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
