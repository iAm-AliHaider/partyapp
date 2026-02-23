import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const friendship = await prisma.friendship.findUnique({ where: { id } });

    if (!friendship) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (friendship.addresseeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (friendship.status !== "PENDING") {
      return NextResponse.json({ error: "Already processed" }, { status: 400 });
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: "REJECTED" },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
