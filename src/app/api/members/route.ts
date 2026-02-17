import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get("districtId");
  const provinceId = searchParams.get("provinceId");
  const tehsilId = searchParams.get("tehsilId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const where: any = { status: "ACTIVE" as const };
    if (districtId) where.districtId = districtId;
    if (provinceId) where.provinceId = provinceId;
    if (tehsilId) where.tehsilId = tehsilId;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        select: {
          id: true, name: true, score: true, rank: true, referralCode: true,
          membershipNumber: true,
          province: { select: { name: true } },
          district: { select: { name: true } },
          tehsil: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { score: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    return NextResponse.json({ members, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
