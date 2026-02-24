import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";

// GET /api/campaigns — list my campaign sessions (or all for admin)
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const isAdmin = ["ADMIN", "OWNER"].includes((session.user as any).role);
  const memberId = searchParams.get("memberId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (isAdmin && memberId) {
    where.memberId = memberId;
  } else if (!isAdmin) {
    where.memberId = session.user.id;
  }
  if (status) where.status = status;

  const [sessions, total] = await Promise.all([
    prisma.campaignSession.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, photoUrl: true, district: { select: { name: true } } } },
        photos: { select: { id: true, photoUrl: true, verified: true } },
        _count: { select: { photos: true, gpsTrail: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaignSession.count({ where }),
  ]);

  return NextResponse.json({ sessions, total, page, limit });
}

// POST /api/campaigns — start a new campaign session
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { latitude, longitude, notes } = body;

  if (!latitude || !longitude) {
    return NextResponse.json({ error: "GPS location required to start campaign" }, { status: 400 });
  }

  // Check if member already has an active session
  const active = await prisma.campaignSession.findFirst({
    where: { memberId: session.user.id, status: "ACTIVE" },
  });
  if (active) {
    return NextResponse.json({ error: "You already have an active campaign session", activeSession: active }, { status: 409 });
  }

  const campaignSession = await prisma.campaignSession.create({
    data: {
      memberId: session.user.id,
      startLat: latitude,
      startLng: longitude,
      notes,
      adminReview: "PENDING",
    },
  });

  // Record first GPS point
  await prisma.campaignGpsPoint.create({
    data: {
      sessionId: campaignSession.id,
      latitude,
      longitude,
    },
  });

  return NextResponse.json(campaignSession, { status: 201 });
}
