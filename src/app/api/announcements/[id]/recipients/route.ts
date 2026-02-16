import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/announcements/:id/recipients — get recipients with pending status
// Protected by x-api-key header
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const statusFilter = req.nextUrl.searchParams.get("status") || "pending";

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logs = await prisma.announcementLog.findMany({
    where: { announcementId: id, status: statusFilter },
    select: { id: true, memberId: true, phone: true, status: true },
  });

  return NextResponse.json({
    announcement: {
      id: announcement.id,
      title: announcement.title,
      titleUrdu: announcement.titleUrdu,
      message: announcement.message,
      messageUrdu: announcement.messageUrdu,
      status: announcement.status,
    },
    recipients: logs,
  });
}

// PATCH /api/announcements/:id/recipients — mark recipients as sent/failed
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  // body: { updates: [{ logId: string, status: "sent" | "failed", error?: string }] }

  if (!body.updates || !Array.isArray(body.updates)) {
    return NextResponse.json({ error: "updates array required" }, { status: 400 });
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const update of body.updates) {
    await prisma.announcementLog.update({
      where: { id: update.logId },
      data: {
        status: update.status,
        error: update.error || null,
        sentAt: update.status === "sent" ? new Date() : undefined,
      },
    });
    if (update.status === "sent") sentCount++;
    if (update.status === "failed") failedCount++;
  }

  // Check if all logs are processed
  const pendingCount = await prisma.announcementLog.count({
    where: { announcementId: id, status: "pending" },
  });

  // Update announcement status
  if (pendingCount === 0) {
    const totalSent = await prisma.announcementLog.count({
      where: { announcementId: id, status: "sent" },
    });
    const totalFailed = await prisma.announcementLog.count({
      where: { announcementId: id, status: "failed" },
    });
    await prisma.announcement.update({
      where: { id },
      data: {
        status: "SENT",
        sentCount: totalSent,
        failedCount: totalFailed,
        sentAt: new Date(),
      },
    });
  } else {
    await prisma.announcement.update({
      where: { id },
      data: { status: "SENDING" },
    });
  }

  return NextResponse.json({ updated: body.updates.length, pendingRemaining: pendingCount, sentCount, failedCount });
}
