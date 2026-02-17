import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/constituencies — list constituencies (kept for reference/compatibility)
export async function GET(req: NextRequest) {
  try {
    const constituencies = await prisma.constituency.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        nameUrdu: true,
        type: true,
        totalVoters: true,
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ constituencies });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch constituencies" }, { status: 500 });
  }
}
