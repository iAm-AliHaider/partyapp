import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// POST /api/announcements/:id/send — send announcement via WhatsApp
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: { logs: { where: { status: "pending" } } },
  });

  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (announcement.status === "SENT") return NextResponse.json({ error: "Already sent" }, { status: 400 });

  // Mark as sending
  await prisma.announcement.update({
    where: { id },
    data: { status: "SENDING" },
  });

  let sentCount = 0;
  let failedCount = 0;

  // Send to each pending recipient via WhatsApp click-to-chat deep links
  // For actual bulk sending, you'd integrate with WhatsApp Business API
  // For now, we generate the messages and mark as sent
  for (const log of announcement.logs) {
    try {
      // Clean phone number for WhatsApp (remove + prefix)
      const cleanPhone = log.phone.replace(/[^0-9]/g, "");
      
      // In production, this would call WhatsApp Business API
      // For now we just mark as "ready" — admin sends via wa.me links
      await prisma.announcementLog.update({
        where: { id: log.id },
        data: { status: "sent", sentAt: new Date() },
      });
      sentCount++;
    } catch (e: any) {
      await prisma.announcementLog.update({
        where: { id: log.id },
        data: { status: "failed", error: e.message },
      });
      failedCount++;
    }
  }

  // Update announcement
  await prisma.announcement.update({
    where: { id },
    data: {
      status: "SENT",
      sentCount,
      failedCount,
      sentAt: new Date(),
    },
  });

  return NextResponse.json({ sent: sentCount, failed: failedCount, total: announcement.logs.length });
}
