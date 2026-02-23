import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      select: {
        id: true, content: true, likesCount: true, createdAt: true,
        author: { select: { id: true, name: true, photoUrl: true } },
        likes: { where: { memberId: session.user.id }, select: { id: true }, take: 1 },
        _count: { select: { replies: true } },
        replies: {
          select: {
            id: true, content: true, likesCount: true, createdAt: true,
            author: { select: { id: true, name: true, photoUrl: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = comments.length > limit;
    const results = comments.slice(0, limit).map((c) => ({
      ...c, isLiked: c.likes.length > 0, likes: undefined,
    }));

    return NextResponse.json({ comments: results, nextCursor: hasMore ? results[results.length - 1]?.id : null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const { content, parentId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { postId, authorId: session.user.id, content: content.trim(), parentId: parentId || null },
        select: {
          id: true, content: true, likesCount: true, createdAt: true, parentId: true,
          author: { select: { id: true, name: true, photoUrl: true } },
        },
      }),
      prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
    ]);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
