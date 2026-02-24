import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/socials — get my linked social accounts
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const socials = await prisma.memberSocial.findMany({
    where: { memberId: session.user.id },
    orderBy: { platform: "asc" },
  });

  return NextResponse.json(socials);
}

// POST /api/socials — link a social account
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { platform, handle, profileUrl } = body;

  if (!platform || !handle) {
    return NextResponse.json({ error: "Platform and handle are required" }, { status: 400 });
  }

  const validPlatforms = ["FACEBOOK", "TWITTER", "INSTAGRAM", "TIKTOK", "YOUTUBE"];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` }, { status: 400 });
  }

  const social = await prisma.memberSocial.upsert({
    where: { memberId_platform: { memberId: session.user.id, platform } },
    update: { handle, profileUrl: profileUrl || null, updatedAt: new Date() },
    create: { memberId: session.user.id, platform, handle, profileUrl: profileUrl || null },
  });

  return NextResponse.json(social, { status: 201 });
}

// DELETE /api/socials?platform=FACEBOOK — unlink a social account
export async function DELETE(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  if (!platform) return NextResponse.json({ error: "Platform required" }, { status: 400 });

  await prisma.memberSocial.deleteMany({
    where: { memberId: session.user.id, platform: platform as any },
  });

  return NextResponse.json({ ok: true });
}
