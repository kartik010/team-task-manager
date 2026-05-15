import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/auth.js";
import { requireProjectAccess } from "../middleware/projectAccess.js";
import { param } from "../utils/params.js";

const router = Router();

const taskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

router.use(authenticate);

router.get("/project/:projectId", requireProjectAccess, async (req, res) => {
  const projectId = param(req.params.projectId);
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
  res.json({ tasks });
});

router.post("/project/:projectId", requireProjectAccess, async (req: AuthRequest, res) => {
  const projectId = param(req.params.projectId);
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const isAdmin = req.user!.role === "ADMIN";
  if (!isAdmin) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user!.userId,
        },
      },
    });
    if (!membership) {
      res.status(403).json({ error: "Only project members can create tasks" });
      return;
    }
  }

  const { dueDate, assigneeId, ...rest } = parsed.data;

  if (assigneeId) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: assigneeId },
      },
    });
    if (!member) {
      res.status(400).json({ error: "Assignee must be a project member" });
      return;
    }
  }

  const task = await prisma.task.create({
    data: {
      ...rest,
      projectId,
      createdById: req.user!.userId,
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ task });
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = param(req.params.id);
  const parsed = taskSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.task.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId: existing.projectId },
  });

  const isAdmin = req.user!.role === "ADMIN";
  const isAssignee = existing.assigneeId === req.user!.userId;
  const isMember = members.some((m) => m.userId === req.user!.userId);

  if (!isAdmin && !isAssignee && !isMember) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (!isAdmin) {
    const { title, description, assigneeId, dueDate } = parsed.data;
    if (title !== undefined || description !== undefined || assigneeId !== undefined || dueDate !== undefined) {
      res.status(403).json({ error: "Members can only update task status" });
      return;
    }
  }

  const { dueDate, assigneeId, ...rest } = parsed.data;

  if (assigneeId) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: existing.projectId, userId: assigneeId },
      },
    });
    if (!member) {
      res.status(400).json({ error: "Assignee must be a project member" });
      return;
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      assigneeId: assigneeId === undefined ? undefined : assigneeId,
      dueDate:
        dueDate === undefined ? undefined : dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  res.json({ task });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.task.delete({ where: { id: param(req.params.id) } });
  res.status(204).send();
});

export default router;
