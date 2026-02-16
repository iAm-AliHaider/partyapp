import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// POST /api/tasks/:id/verify — admin verify/reject a member's submission
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id: taskId } = params;
  const { memberId, action } = await req.json(); // action: "verify" | "reject"

  if (!memberId || !["verify", "reject"].includes(action)) {
    return NextResponse.json({ error: "memberId and action (verify|reject) required" }, { status: 400 });
  }

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_memberId: { taskId, memberId } },
    include: { task: { select: { title: true, points: true } } },
  });

  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const newStatus = action === "verify" ? "VERIFIED" : "REJECTED";

  await prisma.taskAssignment.update({
    where: { id: assignment.id },
    data: { status: newStatus },
  });

  // Award bonus points on verification
  if (action === "verify" && assignment.task.points > 0) {
    await prisma.member.update({
      where: { id: memberId },
      data: { score: { increment: assignment.task.points } },
    });
  }

  // Notify member
  await prisma.notification.create({
    data: {
      memberId,
      title: action === "verify" ? "✅ Task Verified" : "❌ Task Rejected",
      body: action === "verify"
        ? `Your submission for "${assignment.task.title}" has been verified! +${assignment.task.points} pts`
        : `Your submission for "${assignment.task.title}" was rejected. Please resubmit.`,
      type: "TASK_COMPLETED",
    },
  });

  // Check if all assignments are verified → mark task as DONE
  if (action === "verify") {
    const remaining = await prisma.taskAssignment.count({
      where: { taskId, status: { notIn: ["VERIFIED"] } },
    });
    if (remaining === 0) {
      await prisma.task.update({ where: { id: taskId }, data: { status: "DONE" } });
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}

