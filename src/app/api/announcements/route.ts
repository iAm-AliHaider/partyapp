import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET /api/announcements
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { logs: true } } },
  });

  return NextResponse.json({ announcements });
}

// POST /api/announcements
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, titleUrdu, message, messageUrdu, targetType, provinceId, districtId, tehsilId, constituencyId, memberIds } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Build member filter based on target
    const memberWhere: any = {};
    
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
        titleUrdu: titleUrdu || null,
        message,
        messageUrdu: messageUrdu || null,
        targetType: targetType || "ALL",
        provinceId: provinceId || null,
        districtId: districtId || null,
        tehsilId: tehsilId || null,
        constituencyId: constituencyId || null,
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
  } catch (error: any) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: error.message || "Failed to create announcement" }, { status: 500 });
  }
}
