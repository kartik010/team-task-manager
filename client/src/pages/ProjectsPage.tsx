import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ErrorAlert, Input, Textarea } from "../components/ui";
import type { Project } from "../types";

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api<{ projects: Project[] }>("/api/projects")
      .then((r) => setProjects(r.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setName("");
      setDescription("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-text-muted">Loading projects…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-text-muted mt-1">Manage team projects and members</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "New project"}
          </Button>
        )}
      </div>

      {showForm && isAdmin && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
            {error && <ErrorAlert message={error} />}
            <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create project"}
            </Button>
          </form>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card>
          <p className="text-text-muted">No projects yet.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="hover:border-accent/50 transition-colors h-full">
                <h2 className="font-semibold text-lg">{p.name}</h2>
                {p.description && (
                  <p className="text-text-muted text-sm mt-2 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-text-muted">
                  <span>{p._count?.tasks ?? 0} tasks</span>
                  <span>{p.members.length} members</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
