import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";

// GET /api/projects — list projects (admin: all, member: their assigned)
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const role = (session.user as any).role;
  const memberId = (session.user as any).id;

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;

  // Non-admins only see ACTIVE projects
  if (!["ADMIN", "OWNER"].includes(role)) {
    where.status = "ACTIVE";
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      createdBy: { select: { name: true } },
      districts: { include: { district: { select: { name: true } } } },
      provinces: { include: { province: { select: { name: true } } } },
      _count: { select: { tasks: true } },
      tasks: {
        select: {
          status: true,
          assignments: { where: { memberId }, select: { status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich with progress
  const enriched = projects.map((p) => {
    const totalTasks = p.tasks.length;
    const doneTasks = p.tasks.filter((t) => t.status === "DONE").length;
    const myTasks = p.tasks.filter((t) => t.assignments.length > 0).length;
    const { tasks, ...rest } = p;
    return { ...rest, totalTasks, doneTasks, myTasks, progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 };
  });

  return NextResponse.json({ projects: enriched });
}

// POST /api/projects — create project (admin only)
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const { title, titleUrdu, description, category, priority, startDate, endDate, budget, targetVotes, targetMembers, districtIds, provinceIds } = body;

  if (!title || !category) {
    return NextResponse.json({ error: "Title and category are required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      title,
      titleUrdu,
      description,
      category,
      priority: priority || "MEDIUM",
      status: "DRAFT",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget,
      targetVotes,
      targetMembers,
      createdById: (session.user as any).id,
      districts: districtIds?.length > 0 ? {
        create: districtIds.map((dId: string) => ({ districtId: dId })),
      } : undefined,
      provinces: provinceIds?.length > 0 ? {
        create: provinceIds.map((pId: string) => ({ provinceId: pId })),
      } : undefined,
    },
    include: {
      districts: { include: { district: { select: { name: true } } } },
      provinces: { include: { province: { select: { name: true } } } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
