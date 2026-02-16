import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET /api/announcements — list all announcements
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { logs: true } },
    },
  });

  return NextResponse.json({ announcements });
}

// POST /api/announcements — create announcement
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const { title, titleUrdu, message, messageUrdu, targetType, provinceId, districtId, tehsilId, constituencyId, memberIds } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  // Build member filter based on target
  const memberWhere: any = { phone: { not: null } };
  
  if (targetType === "PROVINCE" && provinceId) {
    memberWhere.provinceId = provinceId;
  } else if (targetType === "DISTRICT" && districtId) {
    memberWhere.districtId = districtId;
  } else if (targetType === "TEHSIL" && tehsilId) {
    memberWhere.tehsilId = tehsilId;
  } else if (targetType === "CONSTITUENCY" && constituencyId) {
    memberWhere.constituencyId = constituencyId;
  } else if (targetType === "INDIVIDUAL" && memberIds?.length) {
    memberWhere.id = { in: memberIds };
  }
  // ALL = no extra filter

  const targetMembers = await prisma.member.findMany({
    where: memberWhere,
    select: { id: true, phone: true, name: true },
  });

  const announcement = await prisma.announcement.create({
    data: {
      title,
      titleUrdu,
      message,
      messageUrdu,
      targetType: targetType || "ALL",
      provinceId,
      districtId,
      tehsilId,
      constituencyId,
      totalTarget: targetMembers.length,
      createdById: (session.user as any).id,
      logs: {
        create: targetMembers.map((m) => ({
          memberId: m.id,
          phone: m.phone,
          status: "pending",
        })),
      },
    },
    include: { _count: { select: { logs: true } } },
  });

  return NextResponse.json(announcement, { status: 201 });
}
