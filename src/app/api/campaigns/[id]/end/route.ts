import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// POST /api/campaigns/[id]/end — end a campaign session
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { latitude, longitude } = body;

  const campaignSession = await prisma.campaignSession.findUnique({
    where: { id },
    include: { gpsTrail: { orderBy: { recordedAt: "asc" } }, _count: { select: { photos: true } } },
  });

  if (!campaignSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (campaignSession.memberId !== session.user.id) return NextResponse.json({ error: "Not your session" }, { status: 403 });
  if (campaignSession.status !== "ACTIVE") return NextResponse.json({ error: "Session not active" }, { status: 400 });

  // Calculate duration
  const durationMs = Date.now() - campaignSession.startedAt.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  // Calculate distance from GPS trail
  let totalDistance = 0;
  const trail = campaignSession.gpsTrail;
  for (let i = 1; i < trail.length; i++) {
    totalDistance += haversine(trail[i - 1].latitude, trail[i - 1].longitude, trail[i].latitude, trail[i].longitude);
  }
  // Add distance to end point if provided
  if (latitude && longitude && trail.length > 0) {
    const last = trail[trail.length - 1];
    totalDistance += haversine(last.latitude, last.longitude, latitude, longitude);
  }

  // Calculate points
  // Base: 5 points per 30 min (min 30 min), +2 per photo, +3 if distance > 500m
  let points = 0;
  if (durationMinutes >= 30) {
    points += Math.floor(durationMinutes / 30) * 5;
  }
  points += campaignSession._count.photos * 2;
  if (totalDistance > 500) points += 3;
  // Cap at 25 points per session
  points = Math.min(points, 25);

  // Anti-gaming: flag if no GPS movement and duration > 30 min
  let flagged = false;
  if (totalDistance < 50 && durationMinutes > 30) flagged = true;

  const updated = await prisma.campaignSession.update({
    where: { id },
    data: {
      status: flagged ? "FLAGGED" : "COMPLETED",
      endLat: latitude || null,
      endLng: longitude || null,
      endedAt: new Date(),
      durationMinutes,
      distanceMeters: Math.round(totalDistance),
      pointsEarned: points,
    },
  });

  // Record final GPS point
  if (latitude && longitude) {
    await prisma.campaignGpsPoint.create({
      data: { sessionId: id, latitude, longitude },
    });
  }

  // Award points to member score (only if not flagged)
  if (!flagged && points > 0) {
    await prisma.member.update({
      where: { id: session.user.id },
      data: { score: { increment: points } },
    });
  }

  return NextResponse.json({ ...updated, flagged });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
