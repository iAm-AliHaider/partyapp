import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

// PATCH — Update zone
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.member.findUnique({ where: { id: session.user.id } });
  if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, nameUrdu, description, latitude, longitude, radiusMeters, type, isActive, startTime, endTime, validFrom, validUntil, isRecurring, districtId } = body;

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (nameUrdu !== undefined) data.nameUrdu = nameUrdu;
  if (description !== undefined) data.description = description;
  if (latitude !== undefined) data.latitude = parseFloat(latitude);
  if (longitude !== undefined) data.longitude = parseFloat(longitude);
  if (radiusMeters !== undefined) data.radiusMeters = parseInt(radiusMeters);
  if (type !== undefined) data.type = type;
  if (isActive !== undefined) data.isActive = isActive;
  if (startTime !== undefined) data.startTime = startTime;
  if (endTime !== undefined) data.endTime = endTime;
  if (validFrom !== undefined) data.validFrom = validFrom ? new Date(validFrom) : null;
  if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;
  if (isRecurring !== undefined) data.isRecurring = isRecurring;
  if (districtId !== undefined) data.districtId = districtId || null;

  const zone = await prisma.attendanceZone.update({ where: { id }, data });
  return NextResponse.json(zone);
}

// DELETE — Delete zone
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.member.findUnique({ where: { id: session.user.id } });
  if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.attendanceRecord.deleteMany({ where: { zoneId: id } });
  await prisma.attendanceZone.delete({ where: { id } });
  
  return NextResponse.json({ ok: true });
}
