import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "national";
  const provinceId = searchParams.get("provinceId");
  const districtId = searchParams.get("districtId");
  const constituencyCode = searchParams.get("constituency");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  try {
    if (type === "national") {
      const leaderboard = await prisma.member.findMany({
        where: { status: "ACTIVE", score: { gt: 0 } },
        select: {
          id: true,
          name: true,
          nameUrdu: true,
          photoUrl: true,
          score: true,
          rank: true,
          membershipNumber: true,
          referralCode: true,
          province: { select: { name: true } },
          district: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
        orderBy: { rank: "asc" },
        take: limit,
      });

      return NextResponse.json({
        type: "national",
        leaderboard: leaderboard.map(m => ({
          rank: m.rank,
          name: m.name,
          nameUrdu: m.nameUrdu,
          photoUrl: m.photoUrl,
          score: m.score,
          membershipNumber: m.membershipNumber,
          referralCount: m._count.referrals,
          province: m.province?.name,
          district: m.district?.name,
        })),
      });
    }

    if (type === "province" && provinceId) {
      const leaderboard = await prisma.member.findMany({
        where: { status: "ACTIVE", score: { gt: 0 }, provinceId },
        select: {
          id: true,
          name: true,
          nameUrdu: true,
          photoUrl: true,
          score: true,
          rank: true,
          membershipNumber: true,
          referralCode: true,
          district: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
        orderBy: { rank: "asc" },
        take: limit,
      });

      return NextResponse.json({
        type: "province",
        provinceId,
        leaderboard: leaderboard.map(m => ({
          rank: m.rank,
          name: m.name,
          nameUrdu: m.nameUrdu,
          photoUrl: m.photoUrl,
          score: m.score,
          membershipNumber: m.membershipNumber,
          referralCount: m._count.referrals,
          district: m.district?.name,
        })),
      });
    }

    if (type === "district" && districtId) {
      const leaderboard = await prisma.member.findMany({
        where: { status: "ACTIVE", score: { gt: 0 }, districtId },
        select: {
          id: true,
          name: true,
          nameUrdu: true,
          photoUrl: true,
          score: true,
          rank: true,
          membershipNumber: true,
          referralCode: true,
          province: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
        orderBy: { rank: "asc" },
        take: limit,
      });

      return NextResponse.json({
        type: "district",
        districtId,
        leaderboard: leaderboard.map(m => ({
          rank: m.rank,
          name: m.name,
          nameUrdu: m.nameUrdu,
          photoUrl: m.photoUrl,
          score: m.score,
          membershipNumber: m.membershipNumber,
          referralCount: m._count.referrals,
          province: m.province?.name,
        })),
      });
    }

    if (type === "constituency" && constituencyCode) {
      const leaderboard = await prisma.member.findMany({
        where: { 
          status: "ACTIVE", 
          score: { gt: 0 },
          constituency: { code: constituencyCode },
        },
        select: {
          id: true,
          name: true,
          nameUrdu: true,
          photoUrl: true,
          score: true,
          rank: true,
          membershipNumber: true,
          referralCode: true,
          district: { select: { name: true } },
          province: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
        orderBy: { rank: "asc" },
        take: limit,
      });

      return NextResponse.json({
        type: "constituency",
        constituencyCode,
        leaderboard: leaderboard.map(m => ({
          rank: m.rank,
          name: m.name,
          nameUrdu: m.nameUrdu,
          photoUrl: m.photoUrl,
          score: m.score,
          membershipNumber: m.membershipNumber,
          referralCount: m._count.referrals,
          district: m.district?.name,
          province: m.province?.name,
        })),
      });
    }

    return NextResponse.json({ 
      error: "Invalid parameters. Provide type=national, or type=province&provinceId=X, or type=district&districtId=X, or type=constituency&constituency=X" 
    }, { status: 400 });
  } catch (error) {
    console.error("Public leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}