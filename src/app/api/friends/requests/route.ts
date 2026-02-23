import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.friendship.findMany({
      where: { addresseeId: session.user.id, status: "PENDING" },
      select: {
        id: true, createdAt: true,
        requester: {
          select: { id: true, name: true, photoUrl: true, district: { select: { name: true } }, score: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await req.json();
    if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });
    if (memberId === session.user.id) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

    // Check if friendship already exists (either direction)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: memberId },
          { requesterId: memberId, addresseeId: session.user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Friendship already exists", status: existing.status }, { status: 409 });
    }

    const friendship = await prisma.friendship.create({
      data: { requesterId: session.user.id, addresseeId: memberId },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
