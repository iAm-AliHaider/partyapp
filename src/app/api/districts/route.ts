import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provinceId = searchParams.get("provinceId");
  const search = searchParams.get("search");

  try {
    const where: any = {};
    if (provinceId) where.provinceId = provinceId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameUrdu: { contains: search, mode: "insensitive" } },
      ];
    }

    const districts = await prisma.district.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameUrdu: true,
        province: { select: { id: true, name: true } },
        _count: { select: { members: true, tehsils: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ districts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch districts" }, { status: 500 });
  }
}
