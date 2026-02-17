import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET /api/tasks/admin — fetch all task assignments for admin review
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // filter by assignment status
  const projectId = url.searchParams.get("projectId");
  const priority = url.searchParams.get("priority");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const where: any = {};

  if (status) where.status = status;
  if (projectId) where.task = { ...where.task, projectId };
  if (priority) where.task = { ...where.task, priority };
  if (search) {
    where.OR = [
      { member: { name: { contains: search, mode: "insensitive" } } },
      { task: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [assignments, total, statusCounts] = await Promise.all([
    prisma.taskAssignment.findMany({
      where,
      include: {
        task: {
          include: {
            project: { select: { id: true, title: true, titleUrdu: true } },
          },
        },
        member: {
          select: {
            id: true, name: true, phone: true, membershipNumber: true,
            district: { select: { name: true } },
            province: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { status: "asc" }, // SUBMITTED first
        { updatedAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.taskAssignment.count({ where }),
    prisma.taskAssignment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  // Get unique projects for filter dropdown
  const projects = await prisma.project.findMany({
    where: { tasks: { some: { assignments: { some: {} } } } },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  const counts: Record<string, number> = {};
  statusCounts.forEach((s) => { counts[s.status] = s._count.status; });

  return NextResponse.json({
    assignments: assignments.map((a) => ({
      id: a.id,
      taskId: a.taskId,
      memberId: a.memberId,
      status: a.status,
      evidence: a.evidence,
      note: a.note,
      completedAt: a.completedAt,
      assignedAt: a.createdAt,
      updatedAt: a.updatedAt,
      task: {
        id: a.task.id,
        title: a.task.title,
        titleUrdu: a.task.titleUrdu,
        description: a.task.description,
        type: a.task.type,
        priority: a.task.priority,
        dueDate: a.task.dueDate,
        points: a.task.points,
        status: a.task.status,
        projectId: a.task.projectId,
        projectTitle: a.task.project.title,
        projectTitleUrdu: a.task.project.titleUrdu,
      },
      member: a.member,
    })),
    total,
    statusCounts: counts,
    projects,
  });
}
