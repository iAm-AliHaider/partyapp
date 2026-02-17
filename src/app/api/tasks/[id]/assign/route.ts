import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// POST /api/tasks/:id/assign — assign task to members by district or individually
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id: taskId } = params;
  const { memberIds, districtId, tehsilId } = await req.json();

  let assignToIds: string[] = memberIds || [];

  // Assign to all active members in district (optionally filtered by tehsil)
  if (districtId && !memberIds?.length) {
    const where: any = { districtId, status: "ACTIVE" };
    if (tehsilId) where.tehsilId = tehsilId;
    const members = await prisma.member.findMany({
      where,
      select: { id: true },
    });
    assignToIds = members.map((m) => m.id);
  }

  if (!assignToIds.length) {
    return NextResponse.json({ error: "No members to assign" }, { status: 400 });
  }

  // Skip already assigned
  const existing = await prisma.taskAssignment.findMany({
    where: { taskId, memberId: { in: assignToIds } },
    select: { memberId: true },
  });
  const existingIds = new Set(existing.map((e) => e.memberId));
  const newIds = assignToIds.filter((id) => !existingIds.has(id));

  if (newIds.length > 0) {
    await prisma.taskAssignment.createMany({
      data: newIds.map((mId) => ({ taskId, memberId: mId })),
    });

    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: { select: { title: true } } } });
    await prisma.notification.createMany({
      data: newIds.map((mId) => ({
        memberId: mId,
        title: "📋 New Task Assigned",
        body: `You've been assigned "${task?.title}" in project "${task?.project.title}"`,
        type: "TASK_ASSIGNED",
      })),
    });
  }

  return NextResponse.json({ assigned: newIds.length, skipped: existingIds.size });
}
