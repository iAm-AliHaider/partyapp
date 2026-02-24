import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// POST /api/campaigns/[id]/gps — record GPS point during active session
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { latitude, longitude, accuracy } = body;

  if (!latitude || !longitude) {
    return NextResponse.json({ error: "GPS coordinates required" }, { status: 400 });
  }

  const campaignSession = await prisma.campaignSession.findUnique({ where: { id } });
  if (!campaignSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (campaignSession.memberId !== session.user.id) return NextResponse.json({ error: "Not your session" }, { status: 403 });
  if (campaignSession.status !== "ACTIVE") return NextResponse.json({ error: "Session not active" }, { status: 400 });

  const point = await prisma.campaignGpsPoint.create({
    data: { sessionId: id, latitude, longitude, accuracy },
  });

  return NextResponse.json(point, { status: 201 });
}
