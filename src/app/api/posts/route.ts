import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId") || session.user.id;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const posts = await prisma.post.findMany({
      where: { authorId: memberId },
      select: {
        id: true, content: true, mediaUrls: true, postType: true, visibility: true,
        likesCount: true, commentsCount: true, sharesCount: true, createdAt: true,
        author: { select: { id: true, name: true, photoUrl: true } },
        sharedPost: {
          select: { id: true, content: true, author: { select: { id: true, name: true } }, createdAt: true },
        },
        likes: { where: { memberId: session.user.id }, select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const results = posts.slice(0, limit).map((p) => ({
      ...p, isLiked: p.likes.length > 0, likes: undefined,
    }));

    return NextResponse.json({ posts: results, nextCursor: hasMore ? results[results.length - 1]?.id : null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, mediaUrls, postType, visibility } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        content: content.trim(),
        mediaUrls: mediaUrls || [],
        postType: postType || "TEXT",
        visibility: visibility || "PUBLIC",
      },
      select: {
        id: true, content: true, mediaUrls: true, postType: true, visibility: true,
        likesCount: true, commentsCount: true, sharesCount: true, createdAt: true,
        author: { select: { id: true, name: true, photoUrl: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
