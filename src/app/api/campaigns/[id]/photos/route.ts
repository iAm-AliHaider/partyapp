import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// POST /api/campaigns/[id]/photos — upload a campaign photo (base64 for now, TODO: proper storage)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { photoUrl, latitude, longitude, exifTimestamp } = body;

  if (!photoUrl) return NextResponse.json({ error: "Photo URL required" }, { status: 400 });

  const campaignSession = await prisma.campaignSession.findUnique({ where: { id } });
  if (!campaignSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (campaignSession.memberId !== session.user.id) return NextResponse.json({ error: "Not your session" }, { status: 403 });
  if (campaignSession.status !== "ACTIVE") return NextResponse.json({ error: "Session not active" }, { status: 400 });

  // Anti-fraud: check EXIF timestamp if provided
  let flagReason: string | null = null;
  if (exifTimestamp) {
    const exifDate = new Date(exifTimestamp);
    const sessionStart = campaignSession.startedAt;
    if (exifDate < sessionStart) {
      flagReason = "Photo EXIF timestamp is before session start";
    }
    const hourAgo = new Date(Date.now() - 3600000);
    if (exifDate < hourAgo) {
      flagReason = "Photo appears to be old (EXIF > 1 hour ago)";
    }
  }

  // Anti-fraud: check GPS distance from session start
  if (latitude && longitude) {
    const dist = haversine(campaignSession.startLat, campaignSession.startLng, latitude, longitude);
    if (dist > 50000) { // 50km — suspicious
      flagReason = `Photo geotag ${Math.round(dist / 1000)}km from session start`;
    }
  }

  const photo = await prisma.campaignPhoto.create({
    data: {
      sessionId: id,
      memberId: session.user.id,
      photoUrl,
      latitude: latitude || null,
      longitude: longitude || null,
      exifTimestamp: exifTimestamp ? new Date(exifTimestamp) : null,
      flagReason,
      verified: !flagReason,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

// GET /api/campaigns/[id]/photos
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const photos = await prisma.campaignPhoto.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(photos);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
