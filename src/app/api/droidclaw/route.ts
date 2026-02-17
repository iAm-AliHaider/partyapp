import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET /api/droidclaw — dashboard data
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const partyId = (session.user as any).partyId;

  const [
    whatsappGroups,
    recentActions,
    socialAccounts,
    actionStats,
    groupsByType,
    districtCoverage,
  ] = await Promise.all([
    prisma.whatsAppGroup.findMany({
      where: { partyId },
      include: { district: { select: { name: true } }, province: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.droidClawAction.findMany({
      where: { partyId },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.socialAccount.findMany({
      where: { partyId },
      orderBy: { platform: "asc" },
    }),
    prisma.droidClawAction.groupBy({
      by: ["status"],
      where: { partyId },
      _count: true,
    }),
    prisma.whatsAppGroup.groupBy({
      by: ["groupType"],
      where: { partyId },
      _count: true,
    }),
    prisma.district.count({
      where: {
        whatsappGroups: { some: { partyId, status: "ACTIVE" } },
      },
    }),
  ]);

  const totalDistricts = await prisma.district.count();

  return NextResponse.json({
    whatsappGroups,
    recentActions,
    socialAccounts,
    stats: {
      totalGroups: whatsappGroups.length,
      activeGroups: whatsappGroups.filter(g => g.status === "ACTIVE").length,
      totalMembers: whatsappGroups.reduce((s, g) => s + g.memberCount, 0),
      districtsCovered: districtCoverage,
      totalDistricts,
      coveragePercent: totalDistricts > 0 ? Math.round((districtCoverage / totalDistricts) * 100) : 0,
      actionsByStatus: actionStats.map(a => ({ status: a.status, count: a._count })),
      groupsByType: groupsByType.map(g => ({ type: g.groupType, count: g._count })),
      totalActions: actionStats.reduce((s, a) => s + a._count, 0),
      socialAccounts: socialAccounts.length,
    },
  });
}

// POST /api/droidclaw — create action or group
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const partyId = (session.user as any).partyId;
  const memberId = (session.user as any).id;
  const body = await req.json();

  if (body.action === "ADD_GROUP") {
    const group = await prisma.whatsAppGroup.create({
      data: {
        name: body.name,
        districtId: body.districtId || null,
        provinceId: body.provinceId || null,
        inviteLink: body.inviteLink || null,
        memberCount: body.memberCount || 0,
        adminPhone: body.adminPhone || null,
        groupType: body.groupType || "DISTRICT",
        partyId,
      },
    });
    return NextResponse.json(group);
  }

  if (body.action === "ADD_SOCIAL") {
    const account = await prisma.socialAccount.create({
      data: {
        platform: body.platform,
        accountName: body.accountName,
        accountId: body.accountId || null,
        followers: body.followers || 0,
        posts: body.posts || 0,
        partyId,
      },
    });
    return NextResponse.json(account);
  }

  if (body.action === "QUEUE_ACTION") {
    const action = await prisma.droidClawAction.create({
      data: {
        type: body.type,
        platform: body.platform || "WHATSAPP",
        title: body.title,
        payload: body.payload ? JSON.stringify(body.payload) : null,
        createdById: memberId,
        partyId,
      },
    });
    return NextResponse.json(action);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PATCH /api/droidclaw — update group or action
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();

  if (body.entity === "group") {
    const group = await prisma.whatsAppGroup.update({
      where: { id: body.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.inviteLink !== undefined && { inviteLink: body.inviteLink }),
        ...(body.memberCount !== undefined && { memberCount: body.memberCount }),
        ...(body.adminPhone !== undefined && { adminPhone: body.adminPhone }),
        ...(body.status && { status: body.status }),
      },
    });
    return NextResponse.json(group);
  }

  if (body.entity === "action") {
    const action = await prisma.droidClawAction.update({
      where: { id: body.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.result && { result: body.result }),
        ...(body.error && { error: body.error }),
        ...(body.status === "RUNNING" && { startedAt: new Date() }),
        ...(["COMPLETED", "FAILED"].includes(body.status) && { completedAt: new Date() }),
      },
    });
    return NextResponse.json(action);
  }

  return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
}

// DELETE /api/droidclaw
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const entity = searchParams.get("entity");

  if (entity === "group" && id) {
    await prisma.whatsAppGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (entity === "action" && id) {
    await prisma.droidClawAction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (entity === "social" && id) {
    await prisma.socialAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Missing id or entity" }, { status: 400 });
}
