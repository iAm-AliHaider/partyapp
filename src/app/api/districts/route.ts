import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provinceId = searchParams.get("provinceId");

  try {
    const where: any = {};
    if (provinceId) where.provinceId = provinceId;

    const districts = await prisma.district.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameUrdu: true,
        provinceId: true,
        province: { select: { name: true } },
        _count: { select: { members: true, tehsils: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ districts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch districts" }, { status: 500 });
  }
}
