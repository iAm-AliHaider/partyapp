import { NextRequest, NextResponse } from "next/server";
import { getConstituencyLeaderboard, getNationalLeaderboard } from "@/lib/ranking-calculator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const constituencyId = searchParams.get("constituencyId");
  const type = searchParams.get("type") || "constituency";
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    if (type === "national") {
      const leaderboard = await getNationalLeaderboard(limit);
      return NextResponse.json({ leaderboard });
    }

    if (!constituencyId) {
      return NextResponse.json({ error: "constituencyId required" }, { status: 400 });
    }

    const leaderboard = await getConstituencyLeaderboard(constituencyId, limit);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Rankings error:", error);
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}
