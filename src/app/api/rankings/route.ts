import { NextRequest, NextResponse } from "next/server";
import { getDistrictLeaderboard, getNationalLeaderboard } from "@/lib/ranking-calculator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get("districtId");
  const type = searchParams.get("type") || "district";
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    if (type === "national") {
      const leaderboard = await getNationalLeaderboard(limit);
      return NextResponse.json({ leaderboard });
    }

    if (!districtId) {
      return NextResponse.json({ error: "districtId required" }, { status: 400 });
    }

    const leaderboard = await getDistrictLeaderboard(districtId, limit);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Rankings error:", error);
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}
