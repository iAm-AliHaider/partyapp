import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      totalReferrals,
      activeToday,
      membersThisMonth,
      districtCoverage,
      topRecruiters,
      recentMembers,
      totalProvinces,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.member.count({ where: { status: "PENDING" } }),
      prisma.referral.count({ where: { status: "VERIFIED" } }),
      prisma.member.count({ where: { lastActiveAt: { gte: today } } }),
      prisma.member.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.member.groupBy({
        by: ["districtId"],
        where: { districtId: { not: null }, status: "ACTIVE" },
        _count: true,
      }),
      prisma.member.findMany({
        where: { status: "ACTIVE" },
        orderBy: { score: "desc" },
        take: 10,
        select: {
          id: true, name: true, score: true, referralCode: true, membershipNumber: true,
          district: { select: { name: true } },
          province: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
      }),
      prisma.member.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, name: true, phone: true, status: true, createdAt: true,
          district: { select: { name: true } },
        },
      }),
      prisma.province.count(),
    ]);

    const totalDistricts = await prisma.district.count();

    return NextResponse.json({
      totalMembers,
      activeMembers,
      pendingMembers,
      totalReferrals,
      activeToday,
      membersThisMonth,
      districtsCovered: districtCoverage.length,
      totalDistricts,
      totalProvinces,
      topRecruiters,
      recentMembers,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
