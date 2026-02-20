import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

import prisma from "@/lib/prisma";

// GET — List all zones (members see active only, admin sees all)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.member.findUnique({ where: { id: session.user.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const isAdmin = member.role === "ADMIN" || member.role === "OWNER";
  
  const where: any = { partyId: member.partyId };
  if (!isAdmin) where.isActive = true;

  const zones = await prisma.attendanceZone.findMany({
    where,
    include: {
      district: { select: { id: true, name: true } },
      _count: { select: { records: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // For each zone, get today's attendance count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const zonesWithStats = await Promise.all(zones.map(async (zone) => {
    const todayCount = await prisma.attendanceRecord.count({
      where: { zoneId: zone.id, status: "verified", checkInTime: { gte: today, lt: tomorrow } },
    });
    return { ...zone, todayCount, totalRecords: zone._count.records };
  }));

  return NextResponse.json({ zones: zonesWithStats });
}

// POST — Create zone (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.member.findUnique({ where: { id: session.user.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (member.role !== "ADMIN" && member.role !== "OWNER") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { name, nameUrdu, description, latitude, longitude, radiusMeters, type, startTime, endTime, validFrom, validUntil, districtId, isRecurring } = body;

  if (!name || !latitude || !longitude) {
    return NextResponse.json({ error: "name, latitude, and longitude are required" }, { status: 400 });
  }

  const zone = await prisma.attendanceZone.create({
    data: {
      name,
      nameUrdu: nameUrdu || null,
      description: description || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusMeters: parseInt(radiusMeters) || 100,
      type: type || "office",
      startTime: startTime || null,
      endTime: endTime || null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      isRecurring: isRecurring !== false,
      districtId: districtId || null,
      partyId: member.partyId,
      createdBy: member.id,
    },
  });

  return NextResponse.json(zone);
}
