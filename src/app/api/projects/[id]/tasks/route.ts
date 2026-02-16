import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// POST /api/projects/:id/tasks — create task + assign to members/constituency
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id: projectId } = params;
  const body = await req.json();
  const { title, titleUrdu, description, type, priority, dueDate, points, memberIds, constituencyId } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  // If constituencyId is provided, assign to all active members in that constituency
  let assignToIds: string[] = memberIds || [];
  if (constituencyId && !memberIds?.length) {
    const members = await prisma.member.findMany({
      where: { constituencyId, status: "ACTIVE" },
      select: { id: true },
    });
    assignToIds = members.map((m) => m.id);
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      titleUrdu,
      description,
      type: type || "GENERAL",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      points: points || 0,
      assignments: assignToIds.length > 0 ? {
        create: assignToIds.map((mId) => ({ memberId: mId })),
      } : undefined,
    },
    include: {
      assignments: { include: { member: { select: { name: true, membershipNumber: true } } } },
    },
  });

  // Notify assigned members
  if (assignToIds.length > 0) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true } });
    await prisma.notification.createMany({
      data: assignToIds.map((mId) => ({
        memberId: mId,
        title: "📋 New Task Assigned",
        body: `You've been assigned "${title}" in project "${project?.title}"`,
        type: "TASK_ASSIGNED",
      })),
    });
  }

  return NextResponse.json(task, { status: 201 });
}

