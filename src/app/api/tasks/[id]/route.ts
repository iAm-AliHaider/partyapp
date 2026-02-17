import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";

// PATCH /api/tasks/:id — update task (admin) or update assignment status (any member)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const role = (session.user as any).role;
  const memberId = (session.user as any).id;

  // If body contains assignmentStatus, this is a member updating their assignment
  // (even admins can have task assignments they need to accept/complete)
  if (body.assignmentStatus) {
    const { assignmentStatus, note, evidence } = body;
    const assignment = await prisma.taskAssignment.findUnique({
      where: { taskId_memberId: { taskId: id, memberId } },
    });

    if (!assignment) return NextResponse.json({ error: "Not assigned to this task" }, { status: 403 });

    const updateData: any = { status: assignmentStatus };
    if (note) updateData.note = note;
    if (evidence) updateData.evidence = evidence;
    if (assignmentStatus === "SUBMITTED") updateData.completedAt = new Date();

    const updated = await prisma.taskAssignment.update({
      where: { id: assignment.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  }

  // Admin: update task itself (title, status, priority, etc.)
  if (!["ADMIN", "OWNER"].includes(role)) {
    return NextResponse.json({ error: "Admin only for task updates" }, { status: 403 });
  }

  const { title, titleUrdu, description, type, priority, status, dueDate, points } = body;
  const data: any = {};
  if (title !== undefined) data.title = title;
  if (titleUrdu !== undefined) data.titleUrdu = titleUrdu;
  if (description !== undefined) data.description = description;
  if (type !== undefined) data.type = type;
  if (priority !== undefined) data.priority = priority;
  if (status !== undefined) data.status = status;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (points !== undefined) data.points = points;

  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(task);
}

// DELETE /api/tasks/:id — delete task (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
