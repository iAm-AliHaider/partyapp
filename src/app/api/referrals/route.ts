import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateMemberScore } from "@/lib/referral-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  try {
    const score = await calculateMemberScore(memberId);

    // Get referral list
    const referrals = await prisma.referral.findMany({
      where: { referrerId: memberId },
      include: {
        referee: {
          select: { id: true, name: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      stats: score,
      referrals: referrals.map((r) => ({
        id: r.referee.id,
        name: r.referee.name,
        status: r.referee.status,
        joinedAt: r.referee.createdAt,
        level: r.level,
        points: r.points,
      })),
    });
  } catch (error) {
    console.error("Referrals error:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
