import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json().catch(() => ({}));

    const original = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!original) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const [shared] = await prisma.$transaction([
      prisma.post.create({
        data: {
          authorId: session.user.id,
          content: body.content || "",
          postType: "SHARED",
          visibility: body.visibility || "PUBLIC",
          sharedPostId: postId,
        },
        select: {
          id: true, content: true, postType: true, createdAt: true,
          author: { select: { id: true, name: true, photoUrl: true } },
          sharedPost: { select: { id: true, content: true, author: { select: { id: true, name: true } }, createdAt: true } },
        },
      }),
      prisma.post.update({ where: { id: postId }, data: { sharesCount: { increment: 1 } } }),
    ]);

    return NextResponse.json(shared, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to share post" }, { status: 500 });
  }
}
