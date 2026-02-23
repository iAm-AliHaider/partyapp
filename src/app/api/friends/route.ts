import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: {
        id: true, createdAt: true,
        requester: {
          select: { id: true, name: true, photoUrl: true, district: { select: { name: true } }, score: true },
        },
        addressee: {
          select: { id: true, name: true, photoUrl: true, district: { select: { name: true } }, score: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((f) => {
      const friend = f.requester.id === userId ? f.addressee : f.requester;
      return { friendshipId: f.id, since: f.createdAt, ...friend };
    });

    return NextResponse.json({ friends, count: friends.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
