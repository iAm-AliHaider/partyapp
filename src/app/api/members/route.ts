import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get("districtId");
  const provinceId = searchParams.get("provinceId");
  const tehsilId = searchParams.get("tehsilId");
  const statusParam = searchParams.get("status");
  const roleParam = searchParams.get("role");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sort") || "score";
  const sortDir = searchParams.get("dir") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const admin = searchParams.get("admin") === "true";

  try {
    const where: any = {};
    
    // If not admin mode, only show active
    if (!admin && !statusParam) {
      where.status = "ACTIVE";
    }
    if (statusParam) where.status = statusParam;
    if (roleParam) where.role = roleParam;
    if (districtId) where.districtId = districtId;
    if (provinceId) where.provinceId = provinceId;
    if (tehsilId) where.tehsilId = tehsilId;

    // Search across name, phone, CNIC, membership number
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { cnic: { contains: search.replace(/-/g, "") } },
        { membershipNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Determine sort
    const orderBy: any = {};
    if (sortBy === "name") orderBy.name = sortDir;
    else if (sortBy === "date") orderBy.createdAt = sortDir;
    else if (sortBy === "rank") orderBy.rank = sortDir;
    else orderBy.score = sortDir;

    const select: any = {
      id: true, name: true, score: true, rank: true, referralCode: true,
      membershipNumber: true, status: true, role: true, createdAt: true,
      province: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
      tehsil: { select: { id: true, name: true } },
    };

    // Admin gets extra fields
    if (admin) {
      select.phone = true;
      select.cnic = true;
      select.age = true;
      select.gender = true;
      select.religion = true;
      select.residentialStatus = true;
      select.country = true;
      select.isVerified = true;
      select.referredBy = { select: { name: true } };
      select._count = { select: { referrals: true } };
    }

    const [members, total, statusCounts] = await Promise.all([
      prisma.member.findMany({
        where,
        select,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
      admin ? prisma.member.groupBy({
        by: ["status"],
        _count: true,
      }) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      members,
      total,
      page,
      limit,
      statusCounts: Array.isArray(statusCounts)
        ? statusCounts.reduce((acc: any, s: any) => { acc[s.status] = s._count; return acc; }, {})
        : {},
    });
  } catch (error) {
    console.error("Members API error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
