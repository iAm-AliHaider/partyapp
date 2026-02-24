import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const POINTS_PER_APPROVED_POST = 5;

// PATCH /api/hashtags/[id]/review — admin approve/reject a submission
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, reviewNote } = body; // APPROVED or REJECTED

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Status must be APPROVED or REJECTED" }, { status: 400 });
  }

  const submission = await prisma.hashtagSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.status !== "PENDING") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  const updated = await prisma.hashtagSubmission.update({
    where: { id },
    data: {
      status,
      reviewNote: reviewNote || null,
      reviewedAt: new Date(),
      reviewedBy: admin.user.id,
      pointsAwarded: status === "APPROVED" ? POINTS_PER_APPROVED_POST : 0,
    },
  });

  // Award points if approved
  if (status === "APPROVED") {
    await prisma.member.update({
      where: { id: submission.memberId },
      data: { score: { increment: POINTS_PER_APPROVED_POST } },
    });
  }

  return NextResponse.json(updated);
}
