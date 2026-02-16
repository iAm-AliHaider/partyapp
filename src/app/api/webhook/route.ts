import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Webhook endpoint for Siyasat AI Agent
 * Actions: summary, top-recruiters, constituency-coverage, member-lookup,
 *          constituency-detail, recent-members, search-member, growth-stats
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "summary";
  const apiKey = req.headers.get("x-api-key");

  if (apiKey !== process.env.WEBHOOK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    switch (action) {
      case "summary": {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalMembers, activeMembers, pendingMembers, totalReferrals, newToday, newThisWeek, constituenciesCovered, totalConstituencies] = await Promise.all([
          prisma.member.count(),
          prisma.member.count({ where: { status: "ACTIVE" } }),
          prisma.member.count({ where: { status: "PENDING" } }),
          prisma.referral.count({ where: { status: "VERIFIED" } }),
          prisma.member.count({ where: { createdAt: { gte: today } } }),
          prisma.member.count({ where: { createdAt: { gte: weekAgo } } }),
          prisma.member.groupBy({ by: ["constituencyId"], where: { constituencyId: { not: null }, status: "ACTIVE" }, _count: true }).then(r => r.length),
          prisma.constituency.count(),
        ]);

        return NextResponse.json({
          totalMembers, activeMembers, pendingMembers, totalReferrals,
          newToday, newThisWeek, constituenciesCovered, totalConstituencies,
          coveragePercent: totalConstituencies > 0 ? Math.round((constituenciesCovered / totalConstituencies) * 100) : 0,
          generatedAt: new Date().toISOString(),
        });
      }

      case "top-recruiters": {
        const limit = parseInt(searchParams.get("limit") || "10");
        const topRecruiters = await prisma.member.findMany({
          where: { status: "ACTIVE", score: { gt: 0 } },
          select: { name: true, score: true, referralCode: true, membershipNumber: true,
            constituency: { select: { code: true, name: true } },
            _count: { select: { referrals: true } },
          },
          orderBy: { score: "desc" },
          take: limit,
        });
        return NextResponse.json({ topRecruiters });
      }

      case "constituency-coverage": {
        const type = searchParams.get("type"); // NA, PP, PS, PK, PB
        const where: any = {};
        if (type) where.type = type;

        const coverage = await prisma.constituency.findMany({
          where,
          select: { code: true, name: true, type: true, _count: { select: { members: true } } },
          orderBy: { code: "asc" },
        });

        const total = coverage.length;
        const covered = coverage.filter(c => (c._count as any).members > 0).length;
        const totalMembers = coverage.reduce((sum, c) => sum + (c._count as any).members, 0);

        return NextResponse.json({ coverage, total, covered, totalMembers, coveragePercent: total > 0 ? Math.round((covered / total) * 100) : 0 });
      }

      case "constituency-detail": {
        const code = searchParams.get("code");
        if (!code) return NextResponse.json({ error: "code parameter required" }, { status: 400 });

        const constituency = await prisma.constituency.findFirst({
          where: { code: { equals: code, mode: "insensitive" } },
          include: {
            members: {
              where: { status: "ACTIVE" },
              select: { name: true, score: true, rank: true, membershipNumber: true, createdAt: true },
              orderBy: { score: "desc" },
              take: 20,
            },
            _count: { select: { members: true } },
          },
        });

        if (!constituency) return NextResponse.json({ error: "Constituency not found" }, { status: 404 });
        return NextResponse.json(constituency);
      }

      case "member-lookup": {
        const phone = searchParams.get("phone");
        const membershipNumber = searchParams.get("membership");
        const cnic = searchParams.get("cnic");

        if (!phone && !membershipNumber && !cnic) {
          return NextResponse.json({ error: "Provide phone, membership, or cnic" }, { status: 400 });
        }

        const where: any = {};
        if (phone) where.phone = phone;
        if (membershipNumber) where.membershipNumber = membershipNumber;
        if (cnic) where.cnic = cnic.replace(/-/g, "");

        const member = await prisma.member.findFirst({
          where,
          select: {
            name: true, phone: true, membershipNumber: true, score: true, rank: true,
            status: true, role: true, referralCode: true, createdAt: true,
            constituency: { select: { code: true, name: true } },
            _count: { select: { referrals: true } },
          },
        });

        if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
        return NextResponse.json(member);
      }

      case "search-member": {
        const query = searchParams.get("q");
        if (!query) return NextResponse.json({ error: "q parameter required" }, { status: 400 });

        const members = await prisma.member.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
              { membershipNumber: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            name: true, phone: true, membershipNumber: true, score: true, status: true,
            constituency: { select: { code: true } },
          },
          take: 10,
        });

        return NextResponse.json({ results: members, count: members.length });
      }

      case "recent-members": {
        const hours = parseInt(searchParams.get("hours") || "24");
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const members = await prisma.member.findMany({
          where: { createdAt: { gte: since } },
          select: {
            name: true, phone: true, membershipNumber: true, status: true, createdAt: true,
            constituency: { select: { code: true, name: true } },
            referredBy: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ members, count: members.length, since: since.toISOString() });
      }

      case "growth-stats": {
        const days = parseInt(searchParams.get("days") || "7");
        const results: { date: string; count: number }[] = [];

        for (let i = days - 1; i >= 0; i--) {
          const dayStart = new Date();
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);

          const count = await prisma.member.count({
            where: { createdAt: { gte: dayStart, lt: dayEnd } },
          });

          results.push({ date: dayStart.toISOString().split("T")[0], count });
        }

        return NextResponse.json({ growth: results, totalDays: days });
      }

      default:
        return NextResponse.json({
          error: "Unknown action",
          availableActions: ["summary", "top-recruiters", "constituency-coverage", "constituency-detail", "member-lookup", "search-member", "recent-members", "growth-stats"],
        }, { status: 400 });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
