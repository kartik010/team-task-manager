import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-elevated/60 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary:
      "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20",
    secondary:
      "bg-surface-muted hover:bg-border text-text border border-border",
    danger: "bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30",
    ghost: "hover:bg-surface-muted text-text-muted hover:text-text",
  };
  return (
    <button
      type="button"
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-text-muted mb-1.5">
          {label}
        </span>
      )}
      <input
        className={`w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-text-muted mb-1.5">
          {label}
        </span>
      )}
      <select
        className={`w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-text-muted mb-1.5">
          {label}
        </span>
      )}
      <textarea
        className={`w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y min-h-[80px] ${className}`}
        {...props}
      />
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    TODO: "bg-surface-muted text-text-muted",
    IN_PROGRESS: "bg-warning/20 text-warning",
    DONE: "bg-success/20 text-success",
  };
  const labels: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? styles.TODO}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3">
      {message}
    </div>
  );
}
