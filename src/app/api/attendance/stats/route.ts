import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.member.findUnique({ where: { id: session.user.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const isAdmin = member.role === "ADMIN" || member.role === "OWNER";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const baseWhere: any = isAdmin ? {} : { memberId: member.id };

  const [todayVerified, todayRejected, weekTotal, totalAll, uniqueMembers, activeZones] = await Promise.all([
    prisma.attendanceRecord.count({ where: { ...baseWhere, status: "verified", checkInTime: { gte: today, lt: tomorrow } } }),
    prisma.attendanceRecord.count({ where: { ...baseWhere, status: "rejected", checkInTime: { gte: today, lt: tomorrow } } }),
    prisma.attendanceRecord.count({ where: { ...baseWhere, status: "verified", checkInTime: { gte: weekAgo } } }),
    prisma.attendanceRecord.count({ where: { ...baseWhere, status: "verified" } }),
    isAdmin ? prisma.attendanceRecord.groupBy({ by: ['memberId'], where: { status: "verified", checkInTime: { gte: today, lt: tomorrow } } }).then(r => r.length) : Promise.resolve(0),
    prisma.attendanceZone.count({ where: { isActive: true, partyId: member.partyId } }),
  ]);

  // Daily breakdown for last 7 days
  const dailyBreakdown = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
    const count = await prisma.attendanceRecord.count({
      where: { ...baseWhere, status: "verified", checkInTime: { gte: d, lt: nextD } },
    });
    dailyBreakdown.push({ date: d.toISOString().split('T')[0], count });
  }

  // Top attendees (admin only)
  let topAttendees: any[] = [];
  if (isAdmin) {
    const grouped = await prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      where: { status: "verified", checkInTime: { gte: weekAgo } },
      _count: true,
      orderBy: { _count: { memberId: 'desc' } },
      take: 10,
    });
    const memberIds = grouped.map(g => g.memberId);
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, membershipNumber: true },
    });
    topAttendees = grouped.map(g => {
      const m = members.find(m => m.id === g.memberId);
      return { memberId: g.memberId, name: m?.name || 'Unknown', membershipNumber: m?.membershipNumber || '', count: g._count };
    });
  }

  return NextResponse.json({
    today: { verified: todayVerified, rejected: todayRejected, uniqueMembers },
    week: { total: weekTotal },
    total: totalAll,
    activeZones,
    dailyBreakdown,
    topAttendees,
    isAdmin,
  });
}
