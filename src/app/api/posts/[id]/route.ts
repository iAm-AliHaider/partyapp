import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true, content: true, mediaUrls: true, postType: true, visibility: true,
        likesCount: true, commentsCount: true, sharesCount: true, createdAt: true,
        author: {
          select: { id: true, name: true, photoUrl: true, district: { select: { name: true } } },
        },
        sharedPost: {
          select: { id: true, content: true, mediaUrls: true, author: { select: { id: true, name: true, photoUrl: true } }, createdAt: true },
        },
        comments: {
          where: { parentId: null },
          select: {
            id: true, content: true, likesCount: true, createdAt: true,
            author: { select: { id: true, name: true, photoUrl: true } },
            likes: { where: { memberId: session.user.id }, select: { id: true }, take: 1 },
            replies: {
              select: {
                id: true, content: true, likesCount: true, createdAt: true,
                author: { select: { id: true, name: true, photoUrl: true } },
                likes: { where: { memberId: session.user.id }, select: { id: true }, take: 1 },
              },
              orderBy: { createdAt: "asc" },
              take: 5,
            },
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        likes: { where: { memberId: session.user.id }, select: { id: true }, take: 1 },
      },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined,
      comments: post.comments.map((c) => ({
        ...c, isLiked: c.likes.length > 0, likes: undefined,
        replies: c.replies.map((r) => ({ ...r, isLiked: r.likes.length > 0, likes: undefined })),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
