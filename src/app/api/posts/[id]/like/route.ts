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
    const existing = await prisma.postLike.findUnique({
      where: { postId_memberId: { postId, memberId: session.user.id } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
      ]);
      return NextResponse.json({ liked: false });
    } else {
      await prisma.$transaction([
        prisma.postLike.create({ data: { postId, memberId: session.user.id } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
      ]);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
