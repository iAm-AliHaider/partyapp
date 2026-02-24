import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const POINTS_PER_APPROVED_POST = 5;
const MAX_DAILY_SUBMISSIONS = 5;

// GET /api/hashtags — list my hashtag submissions
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["ADMIN", "OWNER"].includes((session.user as any).role);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (!isAdmin) where.memberId = session.user.id;
  if (status) where.status = status;

  const [submissions, total] = await Promise.all([
    prisma.hashtagSubmission.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, photoUrl: true, district: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.hashtagSubmission.count({ where }),
  ]);

  return NextResponse.json({ submissions, total, page, limit });
}

// POST /api/hashtags — submit a hashtag post for review
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { platform, postUrl, hashtag, screenshotUrl } = body;

  if (!platform || !postUrl || !hashtag) {
    return NextResponse.json({ error: "Platform, postUrl, and hashtag are required" }, { status: 400 });
  }

  // Check daily cap
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.hashtagSubmission.count({
    where: { memberId: session.user.id, createdAt: { gte: today } },
  });
  if (todayCount >= MAX_DAILY_SUBMISSIONS) {
    return NextResponse.json({ error: `Daily limit of ${MAX_DAILY_SUBMISSIONS} submissions reached` }, { status: 429 });
  }

  // Check for duplicate URL
  const existing = await prisma.hashtagSubmission.findFirst({
    where: { memberId: session.user.id, postUrl },
  });
  if (existing) {
    return NextResponse.json({ error: "This post URL was already submitted" }, { status: 409 });
  }

  const submission = await prisma.hashtagSubmission.create({
    data: {
      memberId: session.user.id,
      platform,
      postUrl,
      hashtag,
      screenshotUrl: screenshotUrl || null,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
