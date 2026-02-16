import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/announcements/pending — list announcements ready to send (DRAFT or SENDING)
// Protected by x-api-key header
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const announcements = await prisma.announcement.findMany({
    where: { status: { in: ["DRAFT", "SENDING"] } },
    include: {
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      titleUrdu: a.titleUrdu,
      message: a.message,
      messageUrdu: a.messageUrdu,
      targetType: a.targetType,
      status: a.status,
      totalTarget: a.totalTarget,
      recipientCount: a._count.logs,
      createdAt: a.createdAt,
    })),
  });
}
