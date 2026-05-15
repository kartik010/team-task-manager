import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-accent/20 text-accent"
        : "text-text-muted hover:text-text hover:bg-surface-muted"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-elevated/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            Team<span className="text-accent">Task</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/projects" className={navClass}>
              Projects
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:inline">
              {user?.name}
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-surface-muted">
                {isAdmin ? "Admin" : "Member"}
              </span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-text-muted hover:text-text px-2 py-1"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
