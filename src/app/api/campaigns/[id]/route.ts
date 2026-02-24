import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";

// GET /api/campaigns/[id] — get session details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaignSession = await prisma.campaignSession.findUnique({
    where: { id },
    include: {
      member: { select: { id: true, name: true, photoUrl: true, district: { select: { name: true } } } },
      photos: true,
      gpsTrail: { orderBy: { recordedAt: "asc" } },
    },
  });

  if (!campaignSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = ["ADMIN", "OWNER"].includes((session.user as any).role);
  if (!isAdmin && campaignSession.memberId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(campaignSession);
}

// PATCH /api/campaigns/[id] — admin review (approve/reject/flag)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { adminReview, notes } = body; // APPROVED, REJECTED

  if (!["APPROVED", "REJECTED"].includes(adminReview)) {
    return NextResponse.json({ error: "adminReview must be APPROVED or REJECTED" }, { status: 400 });
  }

  const campaignSession = await prisma.campaignSession.findUnique({ where: { id } });
  if (!campaignSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.campaignSession.update({
    where: { id },
    data: {
      adminReview,
      reviewedAt: new Date(),
      reviewedBy: admin.user.id,
      status: adminReview === "REJECTED" ? "CANCELLED" : campaignSession.status === "FLAGGED" ? "COMPLETED" : campaignSession.status,
      notes: notes || campaignSession.notes,
    },
  });

  // If approving a flagged session, award the points now
  if (adminReview === "APPROVED" && campaignSession.status === "FLAGGED" && campaignSession.pointsEarned > 0) {
    await prisma.member.update({
      where: { id: campaignSession.memberId },
      data: { score: { increment: campaignSession.pointsEarned } },
    });
  }

  // If rejecting, revoke points if they were already awarded
  if (adminReview === "REJECTED" && campaignSession.status === "COMPLETED" && campaignSession.pointsEarned > 0) {
    await prisma.member.update({
      where: { id: campaignSession.memberId },
      data: { score: { decrement: campaignSession.pointsEarned } },
    });
  }

  return NextResponse.json(updated);
}
