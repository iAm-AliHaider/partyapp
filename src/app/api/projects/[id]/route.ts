import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";

// GET /api/projects/:id — full project detail with tasks & assignments
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, membershipNumber: true } },
      districts: { include: { district: { select: { name: true, province: { select: { name: true } } } } } },
      provinces: { include: { province: { select: { name: true } } } },
      tasks: {
        orderBy: { createdAt: "asc" },
        include: {
          assignments: {
            include: { member: { select: { id: true, name: true, membershipNumber: true, district: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  return NextResponse.json(project);
}

// PATCH /api/projects/:id — update project (admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = params;
  const body = await req.json();
  const { title, titleUrdu, description, category, priority, status, startDate, endDate, budget, targetVotes, targetMembers, districtIds } = body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (titleUrdu !== undefined) data.titleUrdu = titleUrdu;
  if (description !== undefined) data.description = description;
  if (category !== undefined) data.category = category;
  if (priority !== undefined) data.priority = priority;
  if (status !== undefined) data.status = status;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (budget !== undefined) data.budget = budget;
  if (targetVotes !== undefined) data.targetVotes = targetVotes;
  if (targetMembers !== undefined) data.targetMembers = targetMembers;

  // Update district links if provided
  if (districtIds) {
    await prisma.projectDistrict.deleteMany({ where: { projectId: id } });
    if (districtIds.length > 0) {
      await prisma.projectDistrict.createMany({
        data: districtIds.map((dId: string) => ({ projectId: id, districtId: dId })),
      });
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data,
    include: {
      districts: { include: { district: { select: { name: true } } } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(project);
}

// DELETE /api/projects/:id — delete project (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
