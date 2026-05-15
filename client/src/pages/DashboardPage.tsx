import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Card, StatusBadge } from "../components/ui";
import type { DashboardData, Task } from "../types";

function TaskRow({ task }: { task: Task }) {
  const overdue =
    task.status !== "DONE" && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <Link
      to={`/projects/${task.project?.id ?? task.projectId}`}
      className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0 hover:bg-surface-muted/30 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{task.title}</p>
        <p className="text-sm text-text-muted truncate">
          {task.project?.name ?? "Project"}
          {task.assignee ? ` · ${task.assignee.name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {overdue && (
          <span className="text-xs text-danger font-medium">Overdue</span>
        )}
        <StatusBadge status={task.status} />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ summary: DashboardData["summary"]; overdueTasks: Task[]; recentTasks: Task[]; myTasks: Task[] }>(
      "/api/dashboard"
    )
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-text-muted">Loading dashboard…</p>;
  }

  if (!data) {
    return <p className="text-danger">Failed to load dashboard</p>;
  }

  const { summary, overdueTasks, recentTasks, myTasks } = data;

  const stats = [
    { label: "Projects", value: summary.projectsCount },
    { label: "Total tasks", value: summary.totalTasks },
    { label: "My tasks", value: summary.myTasksCount },
    { label: "Overdue", value: summary.overdueCount, highlight: summary.overdueCount > 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-muted mt-1">Overview of tasks and progress</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p
              className={`text-3xl font-bold ${s.highlight ? "text-danger" : "text-accent"}`}
            >
              {s.value}
            </p>
            <p className="text-sm text-text-muted mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => (
          <Card key={status}>
            <StatusBadge status={status} />
            <p className="text-2xl font-bold mt-2">
              {summary.statusCounts[status] ?? 0}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-danger mb-4">Overdue tasks</h2>
          {overdueTasks.length === 0 ? (
            <p className="text-text-muted text-sm">No overdue tasks</p>
          ) : (
            overdueTasks.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">My assigned tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-text-muted text-sm">No tasks assigned to you</p>
          ) : (
            myTasks.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Recent tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="text-text-muted text-sm">No tasks yet</p>
        ) : (
          recentTasks.map((t) => <TaskRow key={t.id} task={t} />)
        )}
      </Card>
    </div>
  );
}
