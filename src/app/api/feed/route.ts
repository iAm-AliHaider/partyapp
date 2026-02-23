import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

const POST_SELECT = {
  id: true,
  content: true,
  mediaUrls: true,
  postType: true,
  visibility: true,
  likesCount: true,
  commentsCount: true,
  sharesCount: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      name: true,
      photoUrl: true,
      district: { select: { id: true, name: true } },
    },
  },
  sharedPost: {
    select: {
      id: true,
      content: true,
      mediaUrls: true,
      author: { select: { id: true, name: true, photoUrl: true } },
      createdAt: true,
    },
  },
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const userId = session.user.id;

    // Get friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Get user's district
    const me = await prisma.member.findUnique({
      where: { id: userId },
      select: { districtId: true },
    });

    // Feed: own posts + friends' posts + public district posts
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { authorId: userId },
          { authorId: { in: friendIds }, visibility: { in: ["PUBLIC", "FRIENDS"] } },
          ...(me?.districtId
            ? [{ visibility: "PUBLIC" as const, author: { districtId: me.districtId } }]
            : []),
        ],
      },
      select: {
        ...POST_SELECT,
        likes: {
          where: { memberId: userId },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const results = posts.slice(0, limit).map((p) => ({
      ...p,
      isLiked: p.likes.length > 0,
      likes: undefined,
    }));

    return NextResponse.json({
      posts: results,
      nextCursor: hasMore ? results[results.length - 1]?.id : null,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
