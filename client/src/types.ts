export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface ProjectMember {
  id: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  owner: Pick<User, "id" | "name" | "email">;
  members: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  createdBy?: Pick<User, "id" | "name">;
  project?: { id: string; name: string };
}

export interface DashboardData {
  summary: {
    projectsCount: number;
    totalTasks: number;
    myTasksCount: number;
    overdueCount: number;
    statusCounts: Record<TaskStatus, number>;
  };
  overdueTasks: Task[];
  recentTasks: Task[];
  myTasks: Task[];
}
