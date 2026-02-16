import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // NA, PP, PS, PK, PB
  const search = searchParams.get("search");

  try {
    const where: any = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const constituencies = await prisma.constituency.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        nameUrdu: true,
        type: true,
        totalVoters: true,
        _count: { select: { members: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ constituencies });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch constituencies" }, { status: 500 });
  }
}
