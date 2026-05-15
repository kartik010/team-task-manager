import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      email: "member@example.com",
      passwordHash,
      name: "Member User",
      role: "MEMBER",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "Website Redesign",
      description: "Revamp the company marketing website",
      ownerId: admin.id,
      members: {
        create: [{ userId: admin.id }, { userId: member.id }],
      },
    },
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.task.deleteMany({ where: { projectId: project.id } });

  await prisma.task.createMany({
    data: [
      {
        title: "Design homepage mockups",
        description: "Create Figma mockups for the new homepage",
        status: "DONE",
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
        dueDate: yesterday,
      },
      {
        title: "Implement navigation",
        status: "IN_PROGRESS",
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
        dueDate: nextWeek,
      },
      {
        title: "Write content copy",
        status: "TODO",
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
        dueDate: yesterday,
      },
      {
        title: "Set up deployment pipeline",
        status: "TODO",
        projectId: project.id,
        assigneeId: admin.id,
        createdById: admin.id,
        dueDate: nextWeek,
      },
    ],
  });

  console.log("Seed complete:");
  console.log("  Admin:  admin@example.com / password123");
  console.log("  Member: member@example.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
