import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "all";

  try {
    const result: any = {};

    // ── Overview KPIs ──
    if (section === "all" || section === "overview") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const monthAgo = new Date(now.getTime() - 30 * 86400000);

      const [total, active, pending, suspended, newToday, newWeek, newMonth, referrals, totalDistricts] = await Promise.all([
        prisma.member.count(),
        prisma.member.count({ where: { status: "ACTIVE" } }),
        prisma.member.count({ where: { status: "PENDING" } }),
        prisma.member.count({ where: { status: "SUSPENDED" } }),
        prisma.member.count({ where: { createdAt: { gte: today } } }),
        prisma.member.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.member.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.referral.count({ where: { status: "VERIFIED" } }),
        prisma.district.count(),
      ]);

      const covered = await prisma.member.groupBy({
        by: ["districtId"],
        where: { districtId: { not: null }, status: "ACTIVE" },
      });

      result.overview = {
        total, active, pending, suspended,
        newToday, newWeek, newMonth,
        referrals, totalDistricts,
        coveredDistricts: covered.length,
        coveragePercent: totalDistricts > 0 ? Math.round((covered.length / totalDistricts) * 100) : 0,
      };
    }

    // ── Gender Demographics ──
    if (section === "all" || section === "demographics") {
      const genderGroups = await prisma.member.groupBy({
        by: ["gender"],
        _count: true,
        where: { status: "ACTIVE" },
      });

      const ageRanges = await prisma.$queryRaw<any[]>`
        SELECT
          CASE
            WHEN age >= 18 AND age <= 25 THEN '18-25'
            WHEN age >= 26 AND age <= 35 THEN '26-35'
            WHEN age >= 36 AND age <= 45 THEN '36-45'
            WHEN age >= 46 AND age <= 55 THEN '46-55'
            WHEN age >= 56 AND age <= 65 THEN '56-65'
            WHEN age > 65 THEN '65+'
            ELSE 'Unknown'
          END AS range,
          COUNT(*)::int AS count
        FROM members
        WHERE status = 'ACTIVE'
        GROUP BY range
        ORDER BY range
      `;

      const residentialGroups = await prisma.member.groupBy({
        by: ["residentialStatus"],
        _count: true,
        where: { status: "ACTIVE" },
      });

      const religionGroups = await prisma.member.groupBy({
        by: ["religion"],
        _count: true,
        where: { status: "ACTIVE" },
      });

      result.demographics = {
        gender: genderGroups.map(g => ({ label: g.gender || "Unspecified", count: g._count })),
        age: ageRanges.map(a => ({ label: a.range, count: a.count })),
        residential: residentialGroups.map(r => ({ label: r.residentialStatus, count: r._count })),
        religion: religionGroups.map(r => ({ label: r.religion || "Unspecified", count: r._count })),
      };
    }

    // ── Provincial Breakdown ──
    if (section === "all" || section === "provincial") {
      const byProvince = await prisma.$queryRaw<any[]>`
        SELECT p.name, p.id, COUNT(DISTINCT m.id)::int AS members, COUNT(DISTINCT d.id)::int AS districts
        FROM provinces p
        LEFT JOIN districts d ON d.province_id = p.id
        LEFT JOIN members m ON m.district_id = d.id AND m.status = 'ACTIVE'
        GROUP BY p.id, p.name
        ORDER BY members DESC
      `;

      result.provincial = byProvince.map(b => ({
        id: b.id,
        name: b.name,
        members: b.members,
        districts: b.districts,
      }));
    }

    // ── Growth Trend (last 30 days) ──
    if (section === "all" || section === "growth") {
      const days = parseInt(searchParams.get("days") || "30");
      const growth = await prisma.$queryRaw<any[]>`
        SELECT DATE(created_at AT TIME ZONE 'Asia/Karachi') AS date, COUNT(*)::int AS count
        FROM members
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY date
        ORDER BY date
      `;

      const growthMap: Record<string, number> = {};
      growth.forEach(g => {
        const d = new Date(g.date).toISOString().split("T")[0];
        growthMap[d] = g.count;
      });

      const filled: { date: string; count: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        filled.push({ date: key, count: growthMap[key] || 0 });
      }

      result.growth = filled;
    }

    // ── Top Districts ──
    if (section === "all" || section === "top-districts") {
      const topDistricts = await prisma.$queryRaw<any[]>`
        SELECT d.name AS district, p.name AS province, COUNT(m.id)::int AS members
        FROM districts d
        INNER JOIN provinces p ON p.id = d.province_id
        INNER JOIN members m ON m.district_id = d.id AND m.status = 'ACTIVE'
        GROUP BY d.id, d.name, p.name
        ORDER BY members DESC
        LIMIT 15
      `;
      result.topDistricts = topDistricts;
    }

    // ── Top Recruiters ──
    if (section === "all" || section === "top-recruiters") {
      result.topRecruiters = await prisma.member.findMany({
        where: { status: "ACTIVE", score: { gt: 0 } },
        select: {
          name: true, score: true, membershipNumber: true, referralCode: true,
          district: { select: { name: true } },
          province: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
        orderBy: { score: "desc" },
        take: 15,
      });
    }

    // ── Referral Stats ──
    if (section === "all" || section === "referrals") {
      const byLevel = await prisma.referral.groupBy({
        by: ["level"],
        _count: true,
        _sum: { points: true },
        where: { status: "VERIFIED" },
      });

      const byStatus = await prisma.referral.groupBy({
        by: ["status"],
        _count: true,
      });

      result.referralStats = {
        byLevel: byLevel.map(l => ({ level: l.level, count: l._count, points: l._sum.points || 0 })),
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      };
    }

    // ── Role Distribution ──
    if (section === "all" || section === "roles") {
      const byRole = await prisma.member.groupBy({
        by: ["role"],
        _count: true,
        where: { status: "ACTIVE" },
      });
      result.roles = byRole.map(r => ({ role: r.role, count: r._count }));
    }

    // ── Recent Registrations ──
    if (section === "all" || section === "recent") {
      result.recentMembers = await prisma.member.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          name: true, phone: true, membershipNumber: true, status: true,
          gender: true, age: true, createdAt: true,
          district: { select: { name: true } },
          province: { select: { name: true } },
          referredBy: { select: { name: true } },
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
