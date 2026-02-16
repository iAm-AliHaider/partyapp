import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET /api/announcements/:id — get announcement with logs
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
    include: {
      logs: {
        include: {
          // We can't include member directly since it's not a relation
          // We'll fetch separately
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(announcement);
}

// DELETE /api/announcements/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  await prisma.announcement.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
