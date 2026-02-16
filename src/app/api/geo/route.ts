import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/geo?type=provinces|districts|tehsils&provinceId=x&districtId=x
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "provinces";
  const provinceId = searchParams.get("provinceId");
  const districtId = searchParams.get("districtId");

  if (type === "provinces") {
    const provinces = await prisma.province.findMany({
      include: { _count: { select: { districts: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ provinces });
  }

  if (type === "districts") {
    const where: any = {};
    if (provinceId) where.provinceId = provinceId;
    const districts = await prisma.district.findMany({
      where,
      include: {
        province: { select: { name: true, code: true } },
        _count: { select: { tehsils: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ districts });
  }

  if (type === "tehsils") {
    const where: any = {};
    if (districtId) where.districtId = districtId;
    const tehsils = await prisma.tehsil.findMany({
      where,
      include: {
        district: { select: { name: true, province: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ tehsils });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
