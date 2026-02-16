import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { computeConstituencyRankings } from "@/lib/ranking-calculator";

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
    const { constituencyId } = body;

    if (constituencyId) {
      await computeConstituencyRankings(constituencyId);
      return NextResponse.json({ success: true, computed: 1 });
    }

    // Compute all constituencies with active members
    const constituencies = await prisma.constituency.findMany({
      where: { members: { some: { status: "ACTIVE" } } },
      select: { id: true },
    });

    for (const c of constituencies) {
      await computeConstituencyRankings(c.id);
    }

    return NextResponse.json({ success: true, computed: constituencies.length });
  } catch (error) {
    console.error("Compute rankings error:", error);
    return NextResponse.json({ error: "Failed to compute rankings" }, { status: 500 });
  }
}
