import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const me = await prisma.member.findUnique({
      where: { id: userId },
      select: { districtId: true, tehsilId: true, constituencyId: true },
    });

    // Get existing friendship member IDs (both directions)
    const existingFriendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      select: { requesterId: true, addresseeId: true },
    });

    const excludeIds = new Set([userId]);
    existingFriendships.forEach((f) => {
      excludeIds.add(f.requesterId);
      excludeIds.add(f.addresseeId);
    });

    // Find members in same district/tehsil
    const suggestions = await prisma.member.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        status: "ACTIVE",
        OR: [
          ...(me?.districtId ? [{ districtId: me.districtId }] : []),
          ...(me?.tehsilId ? [{ tehsilId: me.tehsilId }] : []),
          ...(me?.constituencyId ? [{ constituencyId: me.constituencyId }] : []),
        ],
      },
      select: {
        id: true, name: true, photoUrl: true, score: true,
        district: { select: { name: true } },
        tehsil: { select: { name: true } },
      },
      orderBy: { score: "desc" },
      take: 10,
    });

    // Count mutual friends for each suggestion
    const friendIds = new Set<string>();
    existingFriendships.forEach((f) => {
      if (f.requesterId !== userId) friendIds.add(f.requesterId);
      if (f.addresseeId !== userId) friendIds.add(f.addresseeId);
    });

    const results = await Promise.all(
      suggestions.map(async (s) => {
        const mutualCount = await prisma.friendship.count({
          where: {
            status: "ACCEPTED",
            OR: [
              { requesterId: s.id, addresseeId: { in: Array.from(friendIds) } },
              { addresseeId: s.id, requesterId: { in: Array.from(friendIds) } },
            ],
          },
        });
        return { ...s, mutualFriends: mutualCount };
      })
    );

    return NextResponse.json({ suggestions: results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
