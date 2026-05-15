import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  Card,
  ErrorAlert,
  Input,
  Select,
  StatusBadge,
  Textarea,
} from "../components/ui";
import type { Project, Task, TaskStatus, User } from "../types";

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [projRes, usersRes] = await Promise.all([
        api<{ project: Project }>(`/api/projects/${id}`),
        api<{ users: User[] }>("/api/auth/users"),
      ]);
      setProject(projRes.project);
      setUsers(usersRes.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const addMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !memberId) return;
    try {
      await api(`/api/projects/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: memberId }),
      });
      setMemberId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  const removeMember = async (userId: string) => {
    if (!id) return;
    await api(`/api/projects/${id}/members/${userId}`, { method: "DELETE" });
    load();
  };

  const createTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api(`/api/tasks/project/${id}`, {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc || undefined,
          dueDate: taskDue ? new Date(taskDue).toISOString() : undefined,
          assigneeId: taskAssignee || undefined,
        }),
      });
      setTaskTitle("");
      setTaskDesc("");
      setTaskDue("");
      setTaskAssignee("");
      setShowTaskForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    await api(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    await api(`/api/tasks/${taskId}`, { method: "DELETE" });
    load();
  };

  if (loading) return <p className="text-text-muted">Loading…</p>;
  if (!project) return <p className="text-danger">Project not found</p>;

  const memberIds = new Set(project.members.map((m) => m.user.id));
  const availableUsers = users.filter((u) => !memberIds.has(u.id));

  return (
    <div className="space-y-6">
      <Link to="/projects" className="text-sm text-accent hover:underline">
        ← Back to projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-text-muted mt-2">{project.description}</p>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="font-semibold mb-4">Team members</h2>
          <ul className="space-y-2">
            {project.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm py-1"
              >
                <span>
                  {m.user.name}
                  <span className="text-text-muted ml-1">({m.user.role})</span>
                </span>
                {isAdmin && m.user.id !== user?.id && (
                  <button
                    type="button"
                    onClick={() => removeMember(m.user.id)}
                    className="text-danger text-xs hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {isAdmin && availableUsers.length > 0 && (
            <form onSubmit={addMember} className="mt-4 flex gap-2">
              <Select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="flex-1"
              >
                <option value="">Add member…</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" disabled={!memberId}>
                Add
              </Button>
            </form>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Tasks</h2>
            <Button onClick={() => setShowTaskForm(!showTaskForm)}>
              {showTaskForm ? "Cancel" : "Add task"}
            </Button>
          </div>

          {showTaskForm && (
            <Card>
              <form onSubmit={createTask} className="space-y-3">
                <Input
                  label="Title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
                <Textarea
                  label="Description"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
                <Input
                  label="Due date"
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                />
                <Select
                  label="Assignee"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </Select>
                <Button type="submit">Create task</Button>
              </form>
            </Card>
          )}

          {!project.tasks?.length ? (
            <Card>
              <p className="text-text-muted text-sm">No tasks in this project.</p>
            </Card>
          ) : (
            project.tasks.map((task: Task) => {
              const overdue =
                task.status !== "DONE" &&
                task.dueDate &&
                new Date(task.dueDate) < new Date();
              const canEditStatus =
                isAdmin ||
                task.assigneeId === user?.id ||
                project.members.some((m) => m.user.id === user?.id);

              return (
                <Card key={task.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-text-muted mt-1">{task.description}</p>
                      )}
                      <p className="text-xs text-text-muted mt-2">
                        Due {formatDate(task.dueDate)}
                        {task.assignee && ` · ${task.assignee.name}`}
                        {overdue && (
                          <span className="text-danger ml-2 font-medium">Overdue</span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {canEditStatus && (
                      <Select
                        value={task.status}
                        onChange={(e) =>
                          updateStatus(task.id, e.target.value as TaskStatus)
                        }
                        className="w-auto text-sm py-1"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </Select>
                    )}
                    {isAdmin && (
                      <Button
                        variant="danger"
                        className="text-xs py-1"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
