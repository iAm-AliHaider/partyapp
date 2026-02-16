import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/tasks/my — get all tasks assigned to the current member
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = (session.user as any).id;

  const assignments = await prisma.taskAssignment.findMany({
    where: { memberId },
    include: {
      task: {
        include: {
          project: { select: { title: true, titleUrdu: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const tasks = assignments.map((a) => ({
    id: a.id,
    taskId: a.taskId,
    title: a.task.title,
    titleUrdu: a.task.titleUrdu,
    description: a.task.description,
    type: a.task.type,
    priority: a.task.priority,
    dueDate: a.task.dueDate,
    points: a.task.points,
    taskStatus: a.task.status,
    assignmentStatus: a.status,
    evidence: a.evidence,
    note: a.note,
    completedAt: a.completedAt,
    assignedAt: a.createdAt,
    projectTitle: a.task.project.title,
    projectTitleUrdu: a.task.project.titleUrdu,
    projectStatus: a.task.project.status,
  }));

  return NextResponse.json({ tasks });
}
