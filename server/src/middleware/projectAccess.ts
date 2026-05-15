import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { param } from "../utils/params.js";
import type { AuthRequest } from "./auth.js";

export async function requireProjectAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const projectId = param(req.params.projectId ?? req.params.id);
  const userId = req.user?.userId;

  if (!projectId || !userId) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (req.user?.role === "ADMIN") {
    next();
    return;
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  const owned = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });

  if (!membership && !owned) {
    res.status(403).json({ error: "You do not have access to this project" });
    return;
  }

  next();
}
