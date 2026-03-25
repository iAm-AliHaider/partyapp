import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const districtId = searchParams.get("districtId");

  if (!memberId || !districtId) {
    return NextResponse.json({ error: "memberId and districtId required" }, { status: 400 });
  }

  try {
    const rankings = await prisma.ranking.findMany({
      where: {
        memberId,
        districtId,
      },
      orderBy: { period: "desc" },
      take: 12,
    });

    return NextResponse.json({
      history: rankings
        .map(r => ({
          period: r.period,
          rank: r.rank,
          score: r.score,
        }))
        .reverse(),
    });
  } catch (error) {
    console.error("Rank history error:", error);
    return NextResponse.json({ error: "Failed to fetch rank history" }, { status: 500 });
  }
}