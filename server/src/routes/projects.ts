import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/auth.js";
import { requireProjectAccess } from "../middleware/projectAccess.js";

const router = Router();

const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

const memberSchema = z.object({
  userId: z.string().min(1),
});

router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === "ADMIN";

  const projects = await prisma.project.findMany({
    where: isAdmin
      ? undefined
      : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json({ projects });
});

router.post("/", requireAdmin, async (req: AuthRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      ownerId: req.user!.userId,
      members: { create: { userId: req.user!.userId } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  res.status(201).json({ project });
});

router.get("/:id", requireProjectAccess, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({ project });
});

router.patch("/:id", requireAdmin, requireProjectAccess, async (req, res) => {
  const parsed = projectSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  res.json({ project });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.post("/:id/members", requireAdmin, async (req, res) => {
  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const member = await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: req.params.id, userId: parsed.data.userId },
    },
    create: { projectId: req.params.id, userId: parsed.data.userId },
    update: {},
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  res.status(201).json({ member });
});

router.delete("/:id/members/:userId", requireAdmin, async (req, res) => {
  await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId: req.params.id, userId: req.params.userId },
    },
  });
  res.status(204).send();
});

export default router;
