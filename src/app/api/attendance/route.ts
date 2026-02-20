import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

import prisma from "@/lib/prisma";

// Haversine formula — calculate distance between two GPS points in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET — List attendance records (admin) or member's own history
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get("zoneId");
  const memberId = searchParams.get("memberId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  
  // Non-admin can only see their own
  const member = await prisma.member.findUnique({ where: { id: session.user.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  
  if (member.role !== "ADMIN" && member.role !== "OWNER") {
    where.memberId = member.id;
  } else {
    if (memberId) where.memberId = memberId;
  }
  
  if (zoneId) where.zoneId = zoneId;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.checkInTime = { gte: start, lt: end };
  }

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      include: { member: { select: { id: true, name: true, phone: true, membershipNumber: true } }, zone: { select: { id: true, name: true, type: true } } },
      orderBy: { checkInTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return NextResponse.json({ records, total, page, limit });
}

// POST — Check in (geofenced)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { latitude, longitude, accuracy, zoneId, deviceInfo, photoUrl } = body;

  if (!latitude || !longitude || !zoneId) {
    return NextResponse.json({ error: "latitude, longitude, and zoneId are required" }, { status: 400 });
  }

  // Get member
  const member = await prisma.member.findUnique({ where: { id: session.user.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Get zone
  const zone = await prisma.attendanceZone.findUnique({ where: { id: zoneId } });
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  if (!zone.isActive) return NextResponse.json({ error: "This attendance zone is not active" }, { status: 400 });

  // Anti-cheat: Check GPS accuracy (reject if > 150m — likely spoofed or indoor)
  if (accuracy && accuracy > 150) {
    return NextResponse.json({ 
      error: "GPS signal too weak. Please go outside or enable high-accuracy location.",
      code: "LOW_ACCURACY"
    }, { status: 400 });
  }

  // Anti-cheat: Check time window
  if (zone.startTime && zone.endTime) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${mins}`;
    if (currentTime < zone.startTime || currentTime > zone.endTime) {
      return NextResponse.json({ 
        error: `Attendance is only allowed between ${zone.startTime} and ${zone.endTime}`,
        code: "OUTSIDE_HOURS"
      }, { status: 400 });
    }
  }

  // Anti-cheat: Check validity dates
  if (zone.validFrom && new Date() < zone.validFrom) {
    return NextResponse.json({ error: "This zone is not yet active", code: "NOT_YET_ACTIVE" }, { status: 400 });
  }
  if (zone.validUntil && new Date() > zone.validUntil) {
    return NextResponse.json({ error: "This zone has expired", code: "EXPIRED" }, { status: 400 });
  }

  // Calculate distance
  const distance = haversineDistance(latitude, longitude, zone.latitude, zone.longitude);

  // Check if within radius
  if (distance > zone.radiusMeters) {
    // Log the rejected attempt too
    await prisma.attendanceRecord.create({
      data: {
        memberId: member.id,
        zoneId: zone.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        distanceMeters: Math.round(distance),
        status: "rejected",
        deviceInfo: deviceInfo || null,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        notes: `Rejected: ${Math.round(distance)}m away (max ${zone.radiusMeters}m)`,
      },
    });

    return NextResponse.json({ 
      error: `You are ${Math.round(distance)}m away from ${zone.name}. Maximum allowed: ${zone.radiusMeters}m`,
      code: "TOO_FAR",
      distance: Math.round(distance),
      maxDistance: zone.radiusMeters,
    }, { status: 400 });
  }

  // Anti-cheat: Cooldown — check if already checked in within 30 minutes
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recentCheckIn = await prisma.attendanceRecord.findFirst({
    where: {
      memberId: member.id,
      zoneId: zone.id,
      status: "verified",
      checkInTime: { gte: thirtyMinAgo },
    },
  });

  if (recentCheckIn) {
    const nextAllowed = new Date(recentCheckIn.checkInTime.getTime() + 30 * 60 * 1000);
    return NextResponse.json({ 
      error: `Already checked in. Next check-in allowed at ${nextAllowed.toLocaleTimeString()}`,
      code: "COOLDOWN",
      nextAllowed: nextAllowed.toISOString(),
    }, { status: 400 });
  }

  // All checks passed — record attendance
  const record = await prisma.attendanceRecord.create({
    data: {
      memberId: member.id,
      zoneId: zone.id,
      latitude,
      longitude,
      accuracy: accuracy || null,
      distanceMeters: Math.round(distance),
      status: "verified",
      photoUrl: photoUrl || null,
      deviceInfo: deviceInfo || null,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
    },
    include: { zone: { select: { name: true } } },
  });

  return NextResponse.json({
    success: true,
    message: `Attendance marked at ${record.zone.name}`,
    record: {
      id: record.id,
      zone: record.zone.name,
      distance: Math.round(distance),
      time: record.checkInTime,
    },
  });
}
