import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { computeDistrictRankings } from "@/lib/ranking-calculator";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["ADMIN", "OWNER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { districtId } = body;

    if (districtId) {
      await computeDistrictRankings(districtId);
      return NextResponse.json({ success: true, computed: 1 });
    }

    // Compute all districts with active members
    const districts = await prisma.district.findMany({
      where: { members: { some: { status: "ACTIVE" } } },
      select: { id: true },
    });

    for (const d of districts) {
      await computeDistrictRankings(d.id);
    }

    return NextResponse.json({ success: true, computed: districts.length });
  } catch (error) {
    console.error("Compute rankings error:", error);
    return NextResponse.json({ error: "Failed to compute rankings" }, { status: 500 });
  }
}
