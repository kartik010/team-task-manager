import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === "ADMIN";
  const now = new Date();

  const projectFilter = isAdmin
    ? {}
    : {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      };

  const taskWhere = isAdmin
    ? {}
    : {
        OR: [
          { assigneeId: userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
        ],
      };

  const [projectsCount, tasks, statusGroups, overdueCount] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.task.findMany({
      where: taskWhere,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: taskWhere,
      _count: { status: true },
    }),
    prisma.task.count({
      where: {
        ...taskWhere,
        status: { not: "DONE" },
        dueDate: { lt: now },
      },
    }),
  ]);

  const overdueTasks = tasks.filter(
    (t: (typeof tasks)[number]) =>
      t.status !== "DONE" && t.dueDate && t.dueDate < now
  );

  const statusCounts: Record<"TODO" | "IN_PROGRESS" | "DONE", number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  };
  for (const g of statusGroups) {
    statusCounts[g.status as keyof typeof statusCounts] = g._count.status;
  }

  const myTasks = tasks.filter(
    (t: (typeof tasks)[number]) => t.assigneeId === userId
  );

  res.json({
    summary: {
      projectsCount,
      totalTasks: tasks.length,
      myTasksCount: myTasks.length,
      overdueCount,
      statusCounts,
    },
    overdueTasks,
    recentTasks: tasks.slice(0, 10),
    myTasks: myTasks.slice(0, 10),
  });
});

export default router;
