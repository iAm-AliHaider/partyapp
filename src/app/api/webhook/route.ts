import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Webhook endpoint for Siyasat AI Agent / OpenClaw
 * Actions: summary, top-recruiters, district-coverage, member-lookup,
 *          district-detail, recent-members, search-member, growth-stats,
 *          pending-announcements, announcement-detail, mark-sent
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

        const [totalMembers, activeMembers, pendingMembers, totalReferrals, newToday, newThisWeek, districtsCovered, totalDistricts] = await Promise.all([
          prisma.member.count(),
          prisma.member.count({ where: { status: "ACTIVE" } }),
          prisma.member.count({ where: { status: "PENDING" } }),
          prisma.referral.count({ where: { status: "VERIFIED" } }),
          prisma.member.count({ where: { createdAt: { gte: today } } }),
          prisma.member.count({ where: { createdAt: { gte: weekAgo } } }),
          prisma.member.groupBy({ by: ["districtId"], where: { districtId: { not: null }, status: "ACTIVE" }, _count: true }).then(r => r.length),
          prisma.district.count(),
        ]);

        return NextResponse.json({
          totalMembers, activeMembers, pendingMembers, totalReferrals,
          newToday, newThisWeek, districtsCovered, totalDistricts,
          coveragePercent: totalDistricts > 0 ? Math.round((districtsCovered / totalDistricts) * 100) : 0,
          generatedAt: new Date().toISOString(),
        });
      }

      case "top-recruiters": {
        const limit = parseInt(searchParams.get("limit") || "10");
        const topRecruiters = await prisma.member.findMany({
          where: { status: "ACTIVE", score: { gt: 0 } },
          select: { name: true, score: true, referralCode: true, membershipNumber: true,
            district: { select: { name: true } },
            province: { select: { name: true } },
            _count: { select: { referrals: true } },
          },
          orderBy: { score: "desc" },
          take: limit,
        });
        return NextResponse.json({ topRecruiters });
      }

      case "district-coverage": {
        const provinceId = searchParams.get("provinceId");
        const where: any = {};
        if (provinceId) where.provinceId = provinceId;

        const districts = await prisma.district.findMany({
          where,
          select: { name: true, province: { select: { name: true } }, _count: { select: { members: true } } },
          orderBy: { name: "asc" },
        });

        const total = districts.length;
        const covered = districts.filter(d => (d._count as any).members > 0).length;
        const totalMembers = districts.reduce((sum, d) => sum + (d._count as any).members, 0);

        return NextResponse.json({ districts, total, covered, totalMembers, coveragePercent: total > 0 ? Math.round((covered / total) * 100) : 0 });
      }

      case "district-detail": {
        const districtName = searchParams.get("name");
        if (!districtName) return NextResponse.json({ error: "name parameter required" }, { status: 400 });

        const district = await prisma.district.findFirst({
          where: { name: { equals: districtName, mode: "insensitive" } },
          include: {
            province: { select: { name: true } },
            members: {
              where: { status: "ACTIVE" },
              select: { name: true, score: true, rank: true, membershipNumber: true, createdAt: true },
              orderBy: { score: "desc" },
              take: 20,
            },
            _count: { select: { members: true } },
          },
        });

        if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });
        return NextResponse.json(district);
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
            district: { select: { name: true } },
            province: { select: { name: true } },
            tehsil: { select: { name: true } },
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
            district: { select: { name: true } },
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
            district: { select: { name: true } },
            province: { select: { name: true } },
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

      // ═══════ ANNOUNCEMENT ACTIONS ═══════

      case "list-all-announcements": {
        const allAnn = await prisma.announcement.findMany({
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, status: true, totalTarget: true, sentCount: true, failedCount: true, createdAt: true },
        });
        return NextResponse.json({ announcements: allAnn });
      }

      case "pending-announcements": {
        const announcements = await prisma.announcement.findMany({
          where: { status: { in: ["DRAFT", "SENDING"] } },
          include: {
            logs: {
              where: { status: "pending" },
              select: { id: true, memberId: true, phone: true },
            },
            _count: { select: { logs: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
          announcements: announcements.map(a => ({
            id: a.id,
            title: a.title,
            titleUrdu: a.titleUrdu,
            message: a.message,
            messageUrdu: a.messageUrdu,
            targetType: a.targetType,
            status: a.status,
            totalTarget: a.totalTarget,
            pendingCount: a.logs.length,
            recipients: a.logs.map(l => ({ logId: l.id, memberId: l.memberId, phone: l.phone })),
            createdAt: a.createdAt,
          })),
        });
      }

      case "announcement-detail": {
        const annId = searchParams.get("id");
        if (!annId) return NextResponse.json({ error: "id parameter required" }, { status: 400 });

        const announcement = await prisma.announcement.findUnique({
          where: { id: annId },
          include: {
            logs: {
              select: { id: true, memberId: true, phone: true, status: true },
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

        return NextResponse.json({
          id: announcement.id,
          title: announcement.title,
          titleUrdu: announcement.titleUrdu,
          message: announcement.message,
          messageUrdu: announcement.messageUrdu,
          status: announcement.status,
          totalTarget: announcement.totalTarget,
          sentCount: announcement.sentCount,
          failedCount: announcement.failedCount,
          recipients: announcement.logs.map(l => ({
            logId: l.id,
            phone: l.phone,
            status: l.status,
          })),
        });
      }

      default:
        return NextResponse.json({
          error: "Unknown action",
          availableActions: [
            "summary", "top-recruiters", "district-coverage", "district-detail",
            "member-lookup", "search-member", "recent-members", "growth-stats",
            "pending-announcements", "announcement-detail",
          ],
        }, { status: 400 });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

// POST webhook — for marking announcement logs as sent
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.WEBHOOK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "mark-sent") {
    const { announcementId, logId, status: logStatus, error: logError } = body;

    if (logId) {
      await prisma.announcementLog.update({
        where: { id: logId },
        data: {
          status: logStatus || "sent",
          error: logError,
          sentAt: logStatus === "sent" ? new Date() : undefined,
        },
      });
    }

    if (announcementId) {
      const [sentCount, failedCount, pendingCount] = await Promise.all([
        prisma.announcementLog.count({ where: { announcementId, status: "sent" } }),
        prisma.announcementLog.count({ where: { announcementId, status: "failed" } }),
        prisma.announcementLog.count({ where: { announcementId, status: "pending" } }),
      ]);

      const newStatus = pendingCount === 0 ? (failedCount > 0 && sentCount === 0 ? "FAILED" : "SENT") : "SENDING";

      await prisma.announcement.update({
        where: { id: announcementId },
        data: { sentCount, failedCount, status: newStatus, sentAt: newStatus === "SENT" ? new Date() : undefined },
      });

      return NextResponse.json({ sentCount, failedCount, pendingCount, status: newStatus });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
